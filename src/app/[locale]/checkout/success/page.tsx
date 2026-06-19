import { CheckCircle2 } from 'lucide-react';
import type { Metadata } from 'next';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import { Button } from '@/components/ui/button';
import { Link } from '@/i18n/navigation';
import { clearCartCookie } from '@/lib/cart-session';
import { db } from '@/lib/db';
import { STRIPE_CONFIGURED, stripe } from '@/lib/stripe';

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'metadata' });
  return { title: t('checkoutSuccess') };
}

export const dynamic = 'force-dynamic';

// The success page is the fallback path for environments where the webhook
// can't reach the app (e.g. local dev without `stripe listen` running). It
// reads the session ID from the URL, asks Stripe whether it's paid, and
// upserts the Order row. The webhook does the same, idempotently.
async function reconcileOrder(sessionId: string): Promise<{ email: string; orderId: string } | null> {
  if (!STRIPE_CONFIGURED) return null;

  try {
    const session = await stripe.checkout.sessions.retrieve(sessionId, {
      expand: ['line_items.data.price.product'],
    });

    if (session.payment_status !== 'paid' || !session.customer_details?.email) {
      return null;
    }

    const md = session.metadata ?? {};
    const totalCents = session.amount_total ?? 0;
    const subtotalCents = session.amount_subtotal ?? totalCents;
    const taxCents = (session.total_details?.amount_tax ?? 0) as number;
    const currency = (session.currency ?? 'cad').toUpperCase();

    // Upsert is idempotent — webhook + success page racing for the same
    // session both end up at the same row.
    const order = await db.order.upsert({
      where: { stripeSessionId: session.id },
      create: {
        stripeSessionId: session.id,
        email: session.customer_details.email,
        status: 'PAID',
        subtotalCents,
        taxCents,
        totalCents,
        currency,
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

    return { email: session.customer_details.email, orderId: order.id };
  } catch {
    return null;
  }
}

export default async function CheckoutSuccessPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ session_id?: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);

  const sp = await searchParams;
  const t = await getTranslations('success');

  let email = 'you';
  let orderId: string | null = null;

  if (sp.session_id) {
    const reconciled = await reconcileOrder(sp.session_id);
    if (reconciled) {
      email = reconciled.email;
      orderId = reconciled.orderId;
      // Customer paid — drop the cart cookie so they get a fresh one next time.
      await clearCartCookie();
    }
  }

  return (
    <div className="mx-auto max-w-xl px-4 py-24 text-center">
      <CheckCircle2 className="mx-auto h-12 w-12 text-emerald-500" aria-hidden />
      <h1 className="mt-6 text-3xl font-semibold tracking-tight">{t('title')}</h1>
      <p className="mt-4 text-muted-foreground">{t('subtitle', { email })}</p>

      {orderId && (
        <p className="mt-4 text-xs text-muted-foreground tabular-nums">
          {t('orderId')}: <span className="font-mono">{orderId}</span>
        </p>
      )}

      <Button asChild className="mt-8">
        <Link href="/books">{t('continue')}</Link>
      </Button>
    </div>
  );
}
