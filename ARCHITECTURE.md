# Architecture

This document explains the load-bearing design decisions in Helm. README covers what the app does and how to run it; this covers *why* it's shaped the way it is.

## High-level flow

```
┌───────────────────┐   click "Add to cart"   ┌──────────────────────┐
│ AddToCartButton   │ ──────────────────────▶ │ Server Action        │
│ (client island,   │                         │  - validate (zod)    │
│  optimistic UI)   │                         │  - ensureCart()      │
└─────────┬─────────┘                         │  - upsert CartItem   │
          │                                   │  - revalidatePath    │
          │                                   └──────────┬───────────┘
          │ Header re-renders (RSC)                      │
          │ with new SUM(quantity)                       │
          ▼                                              │
┌───────────────────┐                                    │
│ Header (RSC)      │ ◀──────────────────────────────────┘
│ reads cart count  │      revalidate('/', 'layout')
└───────────────────┘


┌───────────────────┐  POST form action       ┌──────────────────────┐
│ Checkout form     │ ──────────────────────▶ │ Server Action        │
│ (RSC + native     │                         │  - read cart (server)│
│  form submit)     │                         │  - stripe.checkout   │
└───────────────────┘                         │      .sessions.create│
                                              │  - redirect(session.url)
                                              └──────────┬───────────┘
                                                         │
                                                         ▼
                                              ┌──────────────────────┐
                                              │ Stripe Checkout      │
                                              │ (test mode)          │
                                              └──────────┬───────────┘
                                                         │
                              ┌──────── webhook ─────────┘
                              │  POST /api/webhooks/stripe
                              │  (raw body, signature)
                              ▼
                  ┌──────────────────────┐
                  │ Order upsert         │ ◀── /checkout/success also
                  │ keyed on             │     reconciles via API call
                  │  stripeSessionId     │     — idempotent
                  └──────────────────────┘
```

## Why server-first

Three reasons it's almost-entirely RSCs with small client islands:

1. **The product pages are not user-state-dependent.** Home, catalog, book detail — none of them need anything from the browser to render. Prerendering them is just leaving free performance on the table otherwise.
2. **The cart is server-side anyway.** It lives in SQLite because the cart cookie has to be authoritative across devices for the same anonymous session, and because the catalog snapshot logic (storing `unitPriceCents` at the moment of add) is server-only.
3. **Client islands stay small.** The only places we ship JS are: language switcher, add-to-cart button, cart-line quantity stepper. That's three components, all of them ~50 lines each.

## Why a signed cookie instead of a JWT library

The cart cookie holds one piece of data: the cart's CUID. Wrapping that in a JWT would be 50 KB of dependency for a one-shot `verify`. We use `crypto.createHmac('sha256', secret).update(cartId).digest('base64url')` instead — three lines, no deps, identical security properties for this payload.

The cookie is `HttpOnly`, `SameSite=Lax`, `Secure` in production. It survives 30 days. A pruning cron would expire stale carts in a real deployment; out of scope here.

## Why an authoritative server cart

The most common storefront bug is "user manipulates the cart in DevTools, server accepts the price."

In Helm, the client never sends a price. `addToCart` takes `{ bookSlug, quantity }`. The server resolves the slug against the bundled catalog, upserts the `Book` row, and copies the catalog's `priceCents` into the `CartItem.unitPriceCents` snapshot. The cart's total is recomputed from `CartItem.unitPriceCents × quantity` on every read.

This also gives us pricing stability across catalog updates: if a book's price changes between "added to cart" and "checked out," the customer pays the snapshot price. That's the contract real storefronts honor.

## Why optimistic updates only on the qty stepper

There are three mutation surfaces:

- **Add to cart** — short transition with a checkmark on success. We *could* do a full optimistic-style update of the header badge, but the badge is rendered by an RSC and `revalidatePath` re-reads it in ~100–200 ms. The local "Added" pill hides that latency on the button itself, which is enough.
- **Set / remove cart-line quantity** — full `useOptimistic`. The user is staring at the line; any visible latency reads as broken. The action revalidates and the server's authoritative value wins.
- **Checkout submit** — no optimistic update. The form posts to a server action that creates a Stripe session and `redirect`s; the navigation itself is the feedback.

## Why two paths to the Order row

Webhooks are correct, but they require either a public URL or `stripe listen` running. For local dev that's friction.

Both the webhook and the success page call `upsert({ where: { stripeSessionId: id }, ... })`. Whichever arrives first writes the Order; the second writes the same fields. Stripe's `session.id` is the idempotency key.

This pattern shows up in real codebases too: webhooks are the primary, durable path; the success page is the user-visible reconciliation. Real production deploys keep both because webhooks can fail (network blip, deployed mid-request) and the user-visible page is the customer's only signal that the order went through.

## Why SQLite over Postgres

The whole app fits on a single-writer file DB:

- Cart sessions: one writer per anonymous user, low contention.
- Orders: write-once on webhook receipt.
- Books: rarely written (only on first add-to-cart, then read-only).

SQLite via Prisma also makes the demo zero-config — no Docker, no migrations service. For production this is a one-line provider change (`provider = "postgresql"`) and `npx prisma migrate dev --create-only` to regenerate the migration with Postgres types.

The model layer is identical either way because Prisma abstracts the underlying connection.

## Why `next-intl` over alternatives

We considered three:

| Library            | Verdict      | Why                                                                          |
| ------------------ | ------------ | ---------------------------------------------------------------------------- |
| `next-intl`        | **Chosen**   | First-class RSC support, locale-aware `<Link>` / `redirect`, ICU MessageFormat |
| `next-i18next`     | Rejected     | Pages-router heritage; RSC support is awkward                                |
| App-Router-native i18n via middleware only | Rejected | No ICU plural support, no locale-aware navigation; rebuilding both is the wrong investment |

The `localePrefix: 'always'` setting was a deliberate choice. The alternative (`as-needed`) makes the default-locale URLs ambiguous to crawlers and analytics tools — `/books` could be EN today, FR tomorrow if the default flips. Always-prefixed URLs trade a tiny amount of homepage redirect noise for permanent clarity.

## Why a raw-body Stripe webhook

Stripe verifies the signature against the **exact bytes** of the request body. Any middleware that does `JSON.parse(body)` and re-stringifies (which is what most body parsers do, even if "transparently") changes byte boundaries — whitespace, key ordering, Unicode normalization — and the signature stops verifying.

The route handler:

1. Marks `export const runtime = 'nodejs'` so we get the full Node stream API.
2. Reads `req.text()` to get the raw body once.
3. Passes it directly into `stripe.webhooks.constructEvent`, which does the HMAC internally.

A unit test (`tests/stripe-webhook.test.ts`) exercises the algorithm directly so any regression in the route handler — like adding a `await req.json()` instead — would cause CI to fail.

## Idempotency invariants

The repo relies on three idempotency keys:

1. **Cart cookie `cartId`** — `ensureCart()` checks both the cookie *and* whether the row still exists. If the row was pruned, we create a fresh cart row and re-issue the cookie. Safe to call on every request.
2. **`cartItem(cartId, bookId)` unique index** — `addToCart` is `upsert`-based, so adding the same book again just bumps `quantity`. Two parallel "Add to cart" clicks can't create duplicate lines.
3. **`order.stripeSessionId` unique index** — webhook + success page both `upsert`. Either order, same result.

## What's intentionally out of scope (in this doc, not the README)

- **Distributed locks on cart writes.** SQLite has serialized writes by default. Postgres would need either row-level locks (`SELECT … FOR UPDATE`) or `ON CONFLICT … DO UPDATE` (which Prisma's `upsert` translates to). The current code is correct on both because all cart writes target a single (`cartId`, `bookId`) row.
- **Edge runtime for the cart.** Tempting (lower latency for the header badge), but `@prisma/client` doesn't run on the Edge yet — we'd need `@prisma/client/edge` or a HTTP-Driver Postgres setup. Not worth the complexity for a portfolio.
- **Optimistic UI on add-to-cart.** Considered, decided against — the latency was small enough that the "Added" pill hides it without needing to manage rollback state.
- **CSRF protection on Server Actions.** Next.js validates that Server Action calls come from the same origin via the `Next-Action` header + an opaque action ID. We don't need to layer a token on top.
