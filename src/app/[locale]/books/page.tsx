import { BookCard } from '@/components/book-card';
import { type BookCategory, CATEGORIES, getBooksByCategory } from '@/data/books';
import { Link } from '@/i18n/navigation';
import { cn } from '@/lib/utils';
import type { Metadata } from 'next';
import { getTranslations, setRequestLocale } from 'next-intl/server';

const VALID_CATEGORIES = new Set<string>(CATEGORIES.map((c) => c.value));

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'metadata' });
  return { title: t('books') };
}

// Server component with search-params-driven filter. No client JS for the
// filter chips — the URL is the state, the page re-renders, and the result
// is fully indexable and back-button-friendly.
export default async function BooksPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ category?: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const sp = await searchParams;
  const t = await getTranslations();

  const selected: BookCategory | 'all' =
    sp.category && VALID_CATEGORIES.has(sp.category) ? (sp.category as BookCategory) : 'all';
  const books = getBooksByCategory(selected);

  return (
    <div className="mx-auto max-w-6xl px-4 py-10">
      <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <h1 className="text-3xl font-semibold tracking-tight">{t('books.title')}</h1>
        <p className="text-sm text-muted-foreground tabular-nums">{books.length} books</p>
      </div>

      <nav className="mb-8 flex flex-wrap gap-2" aria-label="filter">
        <FilterChip
          href={{ pathname: '/books' }}
          active={selected === 'all'}
          label={t('books.all')}
        />
        {CATEGORIES.map((c) => (
          <FilterChip
            key={c.value}
            href={{ pathname: '/books', query: { category: c.value } }}
            active={selected === c.value}
            label={t(c.labelKey)}
          />
        ))}
      </nav>

      {books.length === 0 ? (
        <p className="text-center text-sm text-muted-foreground">{t('books.empty')}</p>
      ) : (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
          {books.map((book) => (
            <BookCard key={book.slug} book={book} />
          ))}
        </div>
      )}
    </div>
  );
}

function FilterChip({
  href,
  active,
  label,
}: {
  href: React.ComponentProps<typeof Link>['href'];
  active: boolean;
  label: string;
}) {
  return (
    <Link
      href={href}
      className={cn(
        'rounded-full border px-3 py-1.5 text-sm transition-colors',
        active ? 'bg-primary text-primary-foreground' : 'bg-card hover:bg-accent',
      )}
    >
      {label}
    </Link>
  );
}
