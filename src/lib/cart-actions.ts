'use server';

import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { db } from '@/lib/db';
import { ensureCart, getCartId } from '@/lib/cart-session';

// All actions return a small JSON-friendly result so client components can
// distinguish success from a rollback. Throwing inside a server action is
// caught by Next, but the network round-trip swallows the message — explicit
// result envelopes keep error UX in the client's control.

export type ActionResult<T = undefined> =
  | { ok: true; data?: T }
  | { ok: false; error: string };

const addToCartSchema = z.object({
  bookSlug: z.string().min(1).max(120),
  quantity: z.coerce.number().int().min(1).max(99).default(1),
});

const setQuantitySchema = z.object({
  cartItemId: z.string().min(1),
  quantity: z.coerce.number().int().min(0).max(99),
});

const removeItemSchema = z.object({
  cartItemId: z.string().min(1),
});

/** Add a book to the cart. If the book isn't yet in the local DB (e.g. fresh
 *  install without `db:seed`), upserts it from the in-bundle catalog first. */
export async function addToCart(input: unknown): Promise<ActionResult<{ itemCount: number }>> {
  const parsed = addToCartSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: 'Invalid input' };
  }

  const { bookSlug, quantity } = parsed.data;

  // Lazy import keeps the catalog data out of the client bundle even though
  // this module is server-only.
  const { getBookBySlug } = await import('@/data/books');
  const catalogBook = getBookBySlug(bookSlug);
  if (!catalogBook) return { ok: false, error: 'Book not found' };

  const cart = await ensureCart();

  // Upsert the book row from the catalog snapshot so foreign keys hold even
  // on a freshly created database.
  const book = await db.book.upsert({
    where: { slug: catalogBook.slug },
    create: {
      slug: catalogBook.slug,
      isbn: catalogBook.isbn,
      title: catalogBook.title,
      author: catalogBook.author,
      priceCents: catalogBook.priceCents,
      currency: catalogBook.currency,
      imageUrl: catalogBook.imageUrl,
      description: catalogBook.description,
    },
    update: {},
    select: { id: true, priceCents: true },
  });

  await db.cartItem.upsert({
    where: { cartId_bookId: { cartId: cart.id, bookId: book.id } },
    create: {
      cartId: cart.id,
      bookId: book.id,
      quantity,
      unitPriceCents: book.priceCents,
    },
    update: {
      quantity: { increment: quantity },
    },
  });

  revalidatePath('/', 'layout');

  const itemCount = await getCartItemCount();
  return { ok: true, data: { itemCount } };
}

/** Set a cart line to an absolute quantity. Quantity 0 removes the line. */
export async function setCartItemQuantity(input: unknown): Promise<ActionResult> {
  const parsed = setQuantitySchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: 'Invalid input' };

  const cartId = await getCartId();
  if (!cartId) return { ok: false, error: 'No cart' };

  // Verify the line belongs to the caller's cart before mutating — defense
  // against guessing CUIDs from another session.
  const item = await db.cartItem.findUnique({
    where: { id: parsed.data.cartItemId },
    select: { cartId: true },
  });
  if (!item || item.cartId !== cartId) {
    return { ok: false, error: 'Item not in this cart' };
  }

  if (parsed.data.quantity === 0) {
    await db.cartItem.delete({ where: { id: parsed.data.cartItemId } });
  } else {
    await db.cartItem.update({
      where: { id: parsed.data.cartItemId },
      data: { quantity: parsed.data.quantity },
    });
  }

  revalidatePath('/', 'layout');
  return { ok: true };
}

export async function removeCartItem(input: unknown): Promise<ActionResult> {
  const parsed = removeItemSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: 'Invalid input' };

  const cartId = await getCartId();
  if (!cartId) return { ok: false, error: 'No cart' };

  const item = await db.cartItem.findUnique({
    where: { id: parsed.data.cartItemId },
    select: { cartId: true },
  });
  if (!item || item.cartId !== cartId) {
    return { ok: false, error: 'Item not in this cart' };
  }

  await db.cartItem.delete({ where: { id: parsed.data.cartItemId } });
  revalidatePath('/', 'layout');
  return { ok: true };
}

async function getCartItemCount(): Promise<number> {
  const cartId = await getCartId();
  if (!cartId) return 0;
  const agg = await db.cartItem.aggregate({
    where: { cartId },
    _sum: { quantity: true },
  });
  return agg._sum.quantity ?? 0;
}
