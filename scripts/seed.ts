// Seed script — mirrors the in-bundle catalog into the database so cart items
// can reference durable Book rows. Idempotent: re-runnable in CI and locally.

import { PrismaClient } from '@prisma/client';
import { BOOKS } from '../src/data/books';

const prisma = new PrismaClient();

async function main() {
  console.log(`Seeding ${BOOKS.length} books…`);

  for (const book of BOOKS) {
    await prisma.book.upsert({
      where: { slug: book.slug },
      create: {
        slug: book.slug,
        isbn: book.isbn,
        title: book.title,
        author: book.author,
        priceCents: book.priceCents,
        currency: book.currency,
        imageUrl: book.imageUrl,
        description: book.description,
      },
      update: {
        // Keep title/author/description fresh, but not the price — we deliberately
        // avoid silently repricing existing books.
        title: book.title,
        author: book.author,
        imageUrl: book.imageUrl,
        description: book.description,
      },
    });
  }

  console.log('Done.');
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
