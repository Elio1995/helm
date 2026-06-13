import { ArrowLeft } from 'lucide-react';
import type { Metadata } from 'next';
import Image from 'next/image';
import { notFound } from 'next/navigation';
import { getLocale, getTranslations, setRequestLocale } from 'next-intl/server';
import { AddToCartButton } from '@/components/add-to-cart-button';
import { Badge } from '@/components/ui/badge';
import { BOOKS, getBookBySlug } from '@/data/books';
import { Link } from '@/i18n/navigation';
import { routing } from '@/i18n/routing';
import { formatPrice } from '@/lib/utils';

// Generate one static route per locale × per book at build time. With 15
// books × 2 locales that's 30 prerendered pages — trivial.
export function generateStaticParams() {
  const params: { locale: string; slug: string }[] = [];
  for (const locale of routing.locales) {
    for (const book of BOOKS) {
      params.push({ locale, slug: book.slug });
    }
  }
  return params;
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}): Promise<Metadata> {
  const { locale, slug } = await params;
  const book = getBookBySlug(slug);
  if (!book) return {};
  const t = await getTranslations({ locale, namespace: 'metadata' });
  return {
    title: t('bookDetail', { title: book.title, author: book.author }),
    description: book.description,
    openGraph: {
      title: book.title,
      description: book.description,
      images: [{ url: book.imageUrl, alt: book.title }],
    },
  };
}

export default async function BookDetailPage({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}) {
  const { locale, slug } = await params;
  setRequestLocale(locale);

  const book = getBookBySlug(slug);
  if (!book) notFound();

  const t = await getTranslations();
  const resolvedLocale = (await getLocale()) as 'en' | 'fr';

  return (
    <div className="mx-auto max-w-5xl px-4 py-10">
      <Link
        href="/books"
        className="mb-8 inline-flex items-center gap-1 text-sm text-muted-foreground transition-colors hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" aria-hidden />
        {t('bookDetail.back')}
      </Link>

      <div className="grid gap-10 md:grid-cols-2 md:gap-16">
        <div className="relative mx-auto aspect-[2/3] w-full max-w-sm overflow-hidden rounded-lg border bg-muted">
          <Image
            src={book.imageUrl}
            alt={book.title}
            fill
            sizes="(max-width: 768px) 80vw, 360px"
            className="object-cover"
            priority
          />
        </div>

        <div className="flex flex-col">
          <div className="flex flex-wrap gap-1">
            {book.categories.map((c) => (
              <Badge key={c} variant="muted">
                {t(`categories.${c}` as 'categories.fiction')}
              </Badge>
            ))}
          </div>

          <h1 className="mt-3 text-balance text-3xl font-semibold tracking-tight sm:text-4xl">
            {book.title}
          </h1>
          <p className="mt-1 text-base text-muted-foreground">
            {t('books.by', { author: book.author })}
          </p>

          <p className="mt-6 text-2xl font-semibold tabular-nums">
            {formatPrice(book.priceCents, book.currency, resolvedLocale)}
          </p>

          <div className="mt-6">
            <AddToCartButton slug={book.slug} size="lg" />
          </div>

          <section className="mt-10">
            <h2 className="text-sm font-medium uppercase tracking-wider text-muted-foreground">
              {t('bookDetail.description')}
            </h2>
            <p className="mt-3 text-pretty leading-relaxed">{book.description}</p>
          </section>

          <dl className="mt-8 grid grid-cols-2 gap-y-2 text-sm">
            <dt className="text-muted-foreground">{t('bookDetail.isbn')}</dt>
            <dd className="tabular-nums">{book.isbn}</dd>
          </dl>
        </div>
      </div>
    </div>
  );
}
