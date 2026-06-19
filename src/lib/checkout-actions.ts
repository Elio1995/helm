'use server';

import { redirect } from 'next/navigation';
import { z } from 'zod';
import { readCart } from '@/lib/cart';
import { captureException } from '@/lib/sentry';
import { STRIPE_CONFIGURED, stripe } from '@/lib/stripe';

// Checkout server action. Validates input, builds line items from the
// authoritative cart (never trust prices from the client), creates a Stripe
// Checkout Session, and redirects. The customer pays on stripe.com; we get
// the result back via `/api/webhooks/stripe`.

const checkoutSchema = z.object({
  email: z.string().email(),
  name: z.string().min(1).max(120),
  address1: z.string().min(1).max(160),
  address2: z.string().max(160).optional(),
  city: z.string().min(1).max(80),
  region: z.string().min(1).max(80),
  postal: z.string().min(1).max(20),
  country: z.string().min(2).max(2).default('CA'),
  locale: z.enum(['en', 'fr']).default('en'),
});

export type CheckoutInput = z.infer<typeof checkoutSchema>;

export type CheckoutResult =
  | { ok: true; redirectUrl: string }
  | { ok: false; error: string };

export async function createCheckoutSession(input: CheckoutInput): Promise<CheckoutResult> {
  const parsed = checkoutSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: 'Invalid checkout input' };
  }

  if (!STRIPE_CONFIGURED) {
    return { ok: false, error: 'STRIPE_NOT_CONFIGURED' };
  }

  const cart = await readCart();
  if (cart.lines.length === 0) {
    return { ok: false, error: 'Cart is empty' };
  }

  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000';

  try {
    const session = await stripe.checkout.sessions.create({
      mode: 'payment',
      customer_email: parsed.data.email,
      // Build line items from the database — never accept prices from the
      // client. The cart row owns the unit price snapshot.
      line_items: cart.lines.map((line) => ({
        quantity: line.quantity,
        price_data: {
          currency: line.currency.toLowerCase(),
          unit_amount: line.unitPriceCents,
          product_data: {
            name: line.title,
            description: `by ${line.author}`,
            images: [line.imageUrl],
          },
        },
      })),
      // 13% tax stub matching `cart-math.ts`. In production this would be
      // Stripe Tax with `automatic_tax: { enabled: true }`.
      automatic_tax: { enabled: false },
      metadata: {
        cartId: cart.id,
        shippingName: parsed.data.name,
        shippingLine1: parsed.data.address1,
        shippingLine2: parsed.data.address2 ?? '',
        shippingCity: parsed.data.city,
        shippingRegion: parsed.data.region,
        shippingPostal: parsed.data.postal,
        shippingCountry: parsed.data.country,
      },
      success_url: `${appUrl}/${parsed.data.locale}/checkout/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${appUrl}/${parsed.data.locale}/checkout`,
    });

    if (!session.url) {
      return { ok: false, error: 'Stripe session created without a URL' };
    }

    return { ok: true, redirectUrl: session.url };
  } catch (err) {
    captureException(err, { tags: { surface: 'checkout' } });
    return { ok: false, error: 'Stripe error' };
  }
}

/** Convenience wrapper used by the form's `action={...}` — does the redirect
 *  on the server side so we don't have to ship a client component just for
 *  `window.location.assign`. */
export async function checkoutAndRedirect(formData: FormData): Promise<void> {
  const input = {
    email: String(formData.get('email') ?? ''),
    name: String(formData.get('name') ?? ''),
    address1: String(formData.get('address1') ?? ''),
    address2: String(formData.get('address2') ?? ''),
    city: String(formData.get('city') ?? ''),
    region: String(formData.get('region') ?? ''),
    postal: String(formData.get('postal') ?? ''),
    country: String(formData.get('country') ?? 'CA'),
    locale: (String(formData.get('locale') ?? 'en') as 'en' | 'fr'),
  };

  const result = await createCheckoutSession(input);
  if (!result.ok) {
    // Bounce back to checkout with an error query — the page reads it.
    redirect(`/${input.locale}/checkout?error=${encodeURIComponent(result.error)}`);
  }
  redirect(result.redirectUrl);
}
