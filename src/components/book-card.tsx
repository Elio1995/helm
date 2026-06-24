import type { CatalogBook } from '@/data/books';
import { Link } from '@/i18n/navigation';
import { formatPrice } from '@/lib/utils';
import { getLocale, getTranslations } from 'next-intl/server';
import Image from 'next/image';
import { Badge } from './ui/badge';

// Server component. Renders a single book card on the home / catalog pages.
// The "Add to cart" button lives in a separate client island so the rest of
// the card can stay on the server (no hydration cost for ~15 cards).
export async function BookCard({ book }: { book: CatalogBook }) {
  const t = await getTranslations('books');
  const locale = (await getLocale()) as 'en' | 'fr';

  return (
    <Link
      href={`/books/${book.slug}`}
      className="group flex flex-col overflow-hidden rounded-lg border bg-card transition-shadow hover:shadow-md"
    >
      <div className="relative aspect-[2/3] w-full bg-muted">
        <Image
          src={book.imageUrl}
          alt={book.title}
          fill
          sizes="(max-width: 768px) 50vw, (max-width: 1280px) 25vw, 240px"
          className="object-cover transition-transform duration-300 group-hover:scale-[1.02]"
        />
      </div>
      <div className="flex flex-1 flex-col gap-2 p-4">
        <div className="flex flex-wrap gap-1">
          {book.categories.slice(0, 2).map((c) => (
            <Badge key={c} variant="muted">
              {c}
            </Badge>
          ))}
        </div>
        <div className="flex-1">
          <h3 className="font-semibold leading-tight">{book.title}</h3>
          <p className="text-xs text-muted-foreground">{t('by', { author: book.author })}</p>
        </div>
        <p className="text-sm font-medium">{formatPrice(book.priceCents, book.currency, locale)}</p>
      </div>
    </Link>
  );
}
