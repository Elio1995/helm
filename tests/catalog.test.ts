import { describe, expect, it } from 'vitest';
import {
  BOOKS,
  CATEGORIES,
  getBookBySlug,
  getBooksByCategory,
  getFeaturedBooks,
} from '@/data/books';

describe('catalog data', () => {
  it('has at least 15 unique books', () => {
    expect(BOOKS.length).toBeGreaterThanOrEqual(15);
    const slugs = new Set(BOOKS.map((b) => b.slug));
    expect(slugs.size).toBe(BOOKS.length);
  });

  it('has no duplicate ISBNs (would break the unique index)', () => {
    const isbns = new Set(BOOKS.map((b) => b.isbn));
    expect(isbns.size).toBe(BOOKS.length);
  });

  it('uses integer-cent pricing and the CAD currency on every book', () => {
    for (const b of BOOKS) {
      expect(Number.isInteger(b.priceCents)).toBe(true);
      expect(b.priceCents).toBeGreaterThan(0);
      expect(b.currency).toBe('CAD');
    }
  });

  it('every book references at least one known category', () => {
    const known = new Set(CATEGORIES.map((c) => c.value));
    for (const b of BOOKS) {
      expect(b.categories.length).toBeGreaterThan(0);
      for (const c of b.categories) {
        expect(known.has(c)).toBe(true);
      }
    }
  });

  it('getBookBySlug returns the right book or undefined', () => {
    const first = BOOKS[0]!;
    expect(getBookBySlug(first.slug)?.slug).toBe(first.slug);
    expect(getBookBySlug('does-not-exist')).toBeUndefined();
  });

  it('exposes at least one featured book', () => {
    expect(getFeaturedBooks().length).toBeGreaterThan(0);
  });

  it('filters by category', () => {
    const fiction = getBooksByCategory('fiction');
    expect(fiction.length).toBeGreaterThan(0);
    expect(fiction.every((b) => b.categories.includes('fiction'))).toBe(true);
    expect(getBooksByCategory('all').length).toBe(BOOKS.length);
  });
});
