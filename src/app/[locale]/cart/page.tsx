import type { Metadata } from 'next';
import { getLocale, getTranslations, setRequestLocale } from 'next-intl/server';
import { CartLine } from '@/components/cart-line';
import { Button } from '@/components/ui/button';
import { Link } from '@/i18n/navigation';
import { readCart } from '@/lib/cart';
import { formatPrice } from '@/lib/utils';

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'metadata' });
  return { title: t('cart') };
}

// Cart page is dynamic per request because it reads the cookie. We mark it
// `dynamic = 'force-dynamic'` so Next doesn't try to cache it.
export const dynamic = 'force-dynamic';

export default async function CartPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);

  const cart = await readCart();
  const t = await getTranslations();
  const resolvedLocale = (await getLocale()) as 'en' | 'fr';

  if (cart.lines.length === 0) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-24 text-center">
        <h1 className="text-2xl font-semibold tracking-tight">{t('cart.title')}</h1>
        <p className="mt-4 text-muted-foreground">{t('cart.empty')}</p>
        <Button asChild className="mt-8">
          <Link href="/books">{t('cart.emptyCta')}</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="mx-auto grid max-w-5xl gap-10 px-4 py-10 lg:grid-cols-[1fr_360px]">
      <section>
        <h1 className="mb-6 text-3xl font-semibold tracking-tight">{t('cart.title')}</h1>
        <ul>
          {cart.lines.map((line) => (
            <CartLine key={line.id} line={line} locale={resolvedLocale} />
          ))}
        </ul>
      </section>

      <aside className="h-fit rounded-lg border bg-card p-6">
        <h2 className="mb-4 text-lg font-semibold">{t('checkout.orderSummary')}</h2>
        <dl className="space-y-2 text-sm">
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
        <Button asChild className="mt-6 w-full">
          <Link href="/checkout">{t('cart.checkout')}</Link>
        </Button>
        <Button asChild variant="outline" className="mt-2 w-full">
          <Link href="/books">{t('cart.continue')}</Link>
        </Button>
      </aside>
    </div>
  );
}
