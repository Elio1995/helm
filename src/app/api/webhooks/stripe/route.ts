// Stripe webhook handler.
//
// Stripe POSTs here with a signed payload after a Checkout Session completes.
// We verify the signature, parse the event, and upsert the corresponding
// Order row. The success page reconciles too — whichever arrives first wins;
// the loser is a no-op because `upsert` on `stripeSessionId` is idempotent.
//
// Note: this route MUST NOT be locale-prefixed. Stripe doesn't know about
// our locale routing. The middleware matcher in `src/middleware.ts` excludes
// `/api/*` so the URL stays clean.

import { type NextRequest, NextResponse } from 'next/server';
import type Stripe from 'stripe';
import { db } from '@/lib/db';
import { captureException } from '@/lib/sentry';
import { STRIPE_CONFIGURED, stripe } from '@/lib/stripe';

export const runtime = 'nodejs'; // raw body required — Edge can't do that easily

// Disable Next's body parser so we can read the raw bytes (Stripe verifies the
// signature against the *exact* request body — JSON.parse-and-stringify rounds
// the bytes and breaks the signature).
export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest): Promise<NextResponse> {
  if (!STRIPE_CONFIGURED) {
    return NextResponse.json({ error: 'Stripe not configured' }, { status: 503 });
  }

  const signingSecret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!signingSecret) {
    return NextResponse.json({ error: 'Missing STRIPE_WEBHOOK_SECRET' }, { status: 503 });
  }

  const signature = req.headers.get('stripe-signature');
  if (!signature) {
    return NextResponse.json({ error: 'Missing signature' }, { status: 400 });
  }

  const rawBody = await req.text();

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(rawBody, signature, signingSecret);
  } catch (err) {
    captureException(err, { tags: { surface: 'stripe-webhook', step: 'verify-signature' } });
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 });
  }

  try {
    switch (event.type) {
      case 'checkout.session.completed':
      case 'checkout.session.async_payment_succeeded': {
        const session = event.data.object as Stripe.Checkout.Session;
        await persistPaidSession(session);
        break;
      }
      case 'checkout.session.async_payment_failed':
      case 'checkout.session.expired': {
        const session = event.data.object as Stripe.Checkout.Session;
        await db.order.upsert({
          where: { stripeSessionId: session.id },
          create: {
            stripeSessionId: session.id,
            email: session.customer_details?.email ?? 'unknown@helm.local',
            status: 'FAILED',
            subtotalCents: session.amount_subtotal ?? 0,
            taxCents: (session.total_details?.amount_tax ?? 0) as number,
            totalCents: session.amount_total ?? 0,
            currency: (session.currency ?? 'cad').toUpperCase(),
          },
          update: { status: 'FAILED' },
        });
        break;
      }
      default:
        // Other event types are fine to ignore — we only care about the
        // checkout outcomes here.
        break;
    }
  } catch (err) {
    captureException(err, { tags: { surface: 'stripe-webhook', step: 'handle-event' } });
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }

  return NextResponse.json({ received: true });
}

async function persistPaidSession(session: Stripe.Checkout.Session): Promise<void> {
  const email = session.customer_details?.email;
  if (!email) {
    // Without an email we don't have anywhere to send the receipt — log + bail.
    captureException(new Error('Stripe session missing customer email'), {
      extra: { sessionId: session.id },
    });
    return;
  }

  const md = session.metadata ?? {};

  await db.order.upsert({
    where: { stripeSessionId: session.id },
    create: {
      stripeSessionId: session.id,
      email,
      status: 'PAID',
      subtotalCents: session.amount_subtotal ?? 0,
      taxCents: (session.total_details?.amount_tax ?? 0) as number,
      totalCents: session.amount_total ?? 0,
      currency: (session.currency ?? 'cad').toUpperCase(),
      shippingName: md.shippingName ?? null,
      shippingLine1: md.shippingLine1 ?? null,
      shippingLine2: md.shippingLine2 ?? null,
      shippingCity: md.shippingCity ?? null,
      shippingRegion: md.shippingRegion ?? null,
      shippingPostal: md.shippingPostal ?? null,
      shippingCountry: md.shippingCountry ?? null,
    },
    update: { status: 'PAID' },
  });
}
