import { UserRound } from 'lucide-react';
import type { Metadata } from 'next';
import { getTranslations, setRequestLocale } from 'next-intl/server';

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'metadata' });
  return { title: t('orders') };
}

// Placeholder. Auth is deliberately out of scope (see README "Out of scope").
// The Order model is already wired so that wiring up NextAuth + linking past
// orders by email is a small follow-up — not part of the demo scope.
export default async function OrdersPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);

  const t = await getTranslations('orders');

  return (
    <div className="mx-auto max-w-xl px-4 py-24 text-center">
      <UserRound className="mx-auto h-12 w-12 text-muted-foreground" aria-hidden />
      <h1 className="mt-6 text-2xl font-semibold tracking-tight">{t('title')}</h1>
      <p className="mt-4 text-sm text-muted-foreground">{t('signedOut')}</p>
    </div>
  );
}
