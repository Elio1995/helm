import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { redirect } from '@/i18n/navigation';
import { readCart } from '@/lib/cart';
import { checkoutAndRedirect } from '@/lib/checkout-actions';
import { STRIPE_CONFIGURED } from '@/lib/stripe';
import { formatPrice } from '@/lib/utils';
import { Lock } from 'lucide-react';
import type { Metadata } from 'next';
import { getLocale, getTranslations, setRequestLocale } from 'next-intl/server';

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'metadata' });
  return { title: t('checkout') };
}

export const dynamic = 'force-dynamic';

export default async function CheckoutPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ error?: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);

  const cart = await readCart();
  if (cart.lines.length === 0) {
    redirect({ href: '/cart', locale });
  }

  const t = await getTranslations();
  const resolvedLocale = (await getLocale()) as 'en' | 'fr';
  const sp = await searchParams;

  return (
    <div className="mx-auto grid max-w-5xl gap-10 px-4 py-10 lg:grid-cols-[1fr_360px]">
      <section>
        <h1 className="mb-6 text-3xl font-semibold tracking-tight">{t('checkout.title')}</h1>

        {!STRIPE_CONFIGURED && (
          <div className="mb-6 rounded-md border border-amber-500/40 bg-amber-50 p-4 text-sm text-amber-900 dark:bg-amber-950/40 dark:text-amber-200">
            {t('errors.stripeNotConfigured')}
          </div>
        )}

        {sp.error && (
          <div className="mb-6 rounded-md border border-destructive/40 bg-destructive/5 p-4 text-sm text-destructive">
            {t('errors.generic')}
          </div>
        )}

        <form action={checkoutAndRedirect} className="space-y-8">
          <input type="hidden" name="locale" value={resolvedLocale} />

          <fieldset className="space-y-3">
            <legend className="mb-2 text-sm font-medium uppercase tracking-wider text-muted-foreground">
              {t('checkout.contact')}
            </legend>
            <div className="space-y-1.5">
              <Label htmlFor="email">{t('checkout.email')}</Label>
              <Input id="email" name="email" type="email" required autoComplete="email" />
            </div>
          </fieldset>

          <fieldset className="space-y-3">
            <legend className="mb-2 text-sm font-medium uppercase tracking-wider text-muted-foreground">
              {t('checkout.shipping')}
            </legend>
            <div className="space-y-1.5">
              <Label htmlFor="name">{t('checkout.name')}</Label>
              <Input id="name" name="name" required autoComplete="name" />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="address1">{t('checkout.address1')}</Label>
              <Input id="address1" name="address1" required autoComplete="address-line1" />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="address2">{t('checkout.address2')}</Label>
              <Input id="address2" name="address2" autoComplete="address-line2" />
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label htmlFor="city">{t('checkout.city')}</Label>
                <Input id="city" name="city" required autoComplete="address-level2" />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="region">{t('checkout.region')}</Label>
                <Input
                  id="region"
                  name="region"
                  required
                  autoComplete="address-level1"
                  defaultValue="ON"
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="postal">{t('checkout.postal')}</Label>
                <Input id="postal" name="postal" required autoComplete="postal-code" />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="country">{t('checkout.country')}</Label>
                <Input
                  id="country"
                  name="country"
                  required
                  autoComplete="country"
                  defaultValue="CA"
                  maxLength={2}
                />
              </div>
            </div>
          </fieldset>

          <p className="flex items-center gap-2 text-xs text-muted-foreground">
            <Lock className="h-3.5 w-3.5" aria-hidden />
            {t('checkout.secureNotice')}
          </p>

          <Button type="submit" size="lg" className="w-full" disabled={!STRIPE_CONFIGURED}>
            {t('checkout.pay')}
          </Button>
        </form>
      </section>

      <aside className="h-fit rounded-lg border bg-card p-6">
        <h2 className="mb-4 text-lg font-semibold">{t('checkout.orderSummary')}</h2>
        <ul className="space-y-2 text-sm">
          {cart.lines.map((line) => (
            <li key={line.id} className="flex justify-between gap-3">
              <span className="line-clamp-1">
                {line.title} <span className="text-muted-foreground">× {line.quantity}</span>
              </span>
              <span className="shrink-0 tabular-nums">
                {formatPrice(line.quantity * line.unitPriceCents, line.currency, resolvedLocale)}
              </span>
            </li>
          ))}
        </ul>
        <dl className="mt-4 space-y-2 border-t pt-4 text-sm">
          <div className="flex justify-between">
            <dt className="text-muted-foreground">{t('cart.subtotal')}</dt>
            <dd className="tabular-nums">
              {formatPrice(cart.subtotalCents, cart.currency, resolvedLocale)}
            </dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-muted-foreground">{t('cart.tax')}</dt>
            <dd className="tabular-nums">
              {formatPrice(cart.taxCents, cart.currency, resolvedLocale)}
            </dd>
          </div>
          <div className="flex justify-between border-t pt-2 font-semibold">
            <dt>{t('cart.total')}</dt>
            <dd className="tabular-nums">
              {formatPrice(cart.totalCents, cart.currency, resolvedLocale)}
            </dd>
          </div>
        </dl>
      </aside>
    </div>
  );
}
