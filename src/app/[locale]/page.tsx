import { BookCard } from '@/components/book-card';
import { Button } from '@/components/ui/button';
import { CATEGORIES, getFeaturedBooks } from '@/data/books';
import { Link } from '@/i18n/navigation';
import { ArrowRight } from 'lucide-react';
import { getTranslations, setRequestLocale } from 'next-intl/server';

// Home is a pure server component. The book catalog ships in the bundle so
// there's no data fetch — Next will fully prerender this page at build time
// per locale (see `generateStaticParams` in the layout).
export default async function HomePage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);

  const t = await getTranslations();
  const featured = getFeaturedBooks();

  return (
    <div className="mx-auto max-w-6xl px-4">
      <section className="py-16 sm:py-24">
        <div className="mx-auto max-w-2xl text-center">
          <p className="text-xs font-medium uppercase tracking-widest text-muted-foreground">
            {t('hero.kicker')}
          </p>
          <h1 className="mt-4 text-balance text-4xl font-semibold tracking-tight sm:text-5xl">
            {t('hero.title')}
          </h1>
          <p className="mt-4 text-pretty text-base text-muted-foreground sm:text-lg">
            {t('hero.subtitle')}
          </p>
          <div className="mt-8 flex justify-center">
            <Button asChild size="lg">
              <Link href="/books">
                {t('hero.cta')}
                <ArrowRight className="h-4 w-4" aria-hidden />
              </Link>
            </Button>
          </div>
        </div>
      </section>

      <section className="pb-16">
        <div className="mb-6 flex items-end justify-between">
          <h2 className="text-2xl font-semibold tracking-tight">{t('home.featured')}</h2>
          <Link
            href="/books"
            className="inline-flex items-center gap-1 text-sm text-muted-foreground transition-colors hover:text-foreground"
          >
            {t('home.viewAll')}
            <ArrowRight className="h-3.5 w-3.5" aria-hidden />
          </Link>
        </div>
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
          {featured.map((book) => (
            <BookCard key={book.slug} book={book} />
          ))}
        </div>
      </section>

      <section className="pb-24">
        <h2 className="mb-6 text-2xl font-semibold tracking-tight">{t('home.browseCategories')}</h2>
        <div className="flex flex-wrap gap-2">
          {CATEGORIES.map((c) => (
            <Link
              key={c.value}
              href={{ pathname: '/books', query: { category: c.value } }}
              className="rounded-full border bg-card px-4 py-2 text-sm transition-colors hover:bg-accent"
            >
              {t(c.labelKey)}
            </Link>
          ))}
        </div>
      </section>
    </div>
  );
}
