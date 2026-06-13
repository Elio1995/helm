import { Compass, ShoppingBag } from 'lucide-react';
import { getTranslations } from 'next-intl/server';
import { Link } from '@/i18n/navigation';
import { readCartItemCount } from '@/lib/cart';
import { LanguageSwitcher } from './language-switcher';

// Server component: reads the cart count from the DB on every render. The
// header is included in the root layout, so this runs on every request — but
// it's a single aggregate query (SUM(quantity) WHERE cartId = ?), which is
// cheap on SQLite and indexable on Postgres.
export async function Header() {
  const t = await getTranslations('nav');
  const itemCount = await readCartItemCount();

  return (
    <header className="sticky top-0 z-30 border-b bg-background/80 backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
        <Link href="/" className="flex items-center gap-2 font-semibold tracking-tight">
          <Compass className="h-5 w-5" aria-hidden />
          <span>Helm</span>
        </Link>

        <nav className="hidden gap-6 text-sm md:flex" aria-label="primary">
          <Link href="/" className="text-muted-foreground transition-colors hover:text-foreground">
            {t('home')}
          </Link>
          <Link
            href="/books"
            className="text-muted-foreground transition-colors hover:text-foreground"
          >
            {t('books')}
          </Link>
          <Link
            href="/account/orders"
            className="text-muted-foreground transition-colors hover:text-foreground"
          >
            {t('orders')}
          </Link>
        </nav>

        <div className="flex items-center gap-3">
          <LanguageSwitcher />
          <Link
            href="/cart"
            className="relative inline-flex h-9 items-center gap-1.5 rounded-md border bg-background px-3 text-sm font-medium transition-colors hover:bg-accent"
            aria-label={t('cart')}
          >
            <ShoppingBag className="h-4 w-4" aria-hidden />
            <span className="hidden sm:inline">{t('cart')}</span>
            {itemCount > 0 && (
              <span className="absolute -right-1 -top-1 inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-primary px-1 text-[10px] font-semibold text-primary-foreground">
                {itemCount}
              </span>
            )}
          </Link>
        </div>
      </div>
    </header>
  );
}
