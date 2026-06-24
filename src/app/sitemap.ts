import { BOOKS } from '@/data/books';
import { routing } from '@/i18n/routing';
import type { MetadataRoute } from 'next';

const BASE = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000';

// Sitemap. One entry per static page × per locale, plus one per book × per
// locale. With 15 books that's (3 static + 15 books) × 2 locales = 36 URLs.
export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();
  const entries: MetadataRoute.Sitemap = [];

  for (const locale of routing.locales) {
    const prefix = `${BASE}/${locale}`;
    entries.push(
      { url: prefix, lastModified: now, priority: 1.0 },
      { url: `${prefix}/books`, lastModified: now, priority: 0.9 },
      { url: `${prefix}/cart`, lastModified: now, priority: 0.2 },
    );
    for (const book of BOOKS) {
      entries.push({
        url: `${prefix}/books/${book.slug}`,
        lastModified: now,
        priority: 0.7,
      });
    }
  }

  return entries;
}
