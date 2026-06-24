// Cart read-side. Server-only. Called from RSCs that render the cart page,
// the header badge, and the checkout summary.

import 'server-only';

import { computeCartTotals } from '@/lib/cart-math';
import { getCartId } from '@/lib/cart-session';
import { db } from '@/lib/db';

export interface CartLine {
  id: string;
  bookId: string;
  slug: string;
  title: string;
  author: string;
  imageUrl: string;
  quantity: number;
  unitPriceCents: number;
  currency: string;
}

export interface CartView {
  id: string;
  lines: CartLine[];
  subtotalCents: number;
  taxCents: number;
  totalCents: number;
  itemCount: number;
  currency: string;
}

/** Empty cart that the UI can safely render before a cookie has been set. */
const EMPTY_CART: CartView = {
  id: '',
  lines: [],
  subtotalCents: 0,
  taxCents: 0,
  totalCents: 0,
  itemCount: 0,
  currency: 'CAD',
};

/** Read the current cart. Never throws — returns an empty cart when there's
 *  no cookie or the cookie refers to a pruned row. */
export async function readCart(): Promise<CartView> {
  const cartId = await getCartId();
  if (!cartId) return EMPTY_CART;

  const cart = await db.cart.findUnique({
    where: { id: cartId },
    include: {
      items: {
        include: { book: true },
        orderBy: { createdAt: 'asc' },
      },
    },
  });

  if (!cart) return EMPTY_CART;

  const lines: CartLine[] = cart.items.map((item) => ({
    id: item.id,
    bookId: item.book.id,
    slug: item.book.slug,
    title: item.book.title,
    author: item.book.author,
    imageUrl: item.book.imageUrl,
    quantity: item.quantity,
    unitPriceCents: item.unitPriceCents,
    currency: item.book.currency,
  }));

  const totals = computeCartTotals(lines);
  const firstCurrency = lines[0]?.currency ?? 'CAD';

  return {
    id: cart.id,
    lines,
    ...totals,
    currency: firstCurrency,
  };
}

/** Quick count for the header badge — cheaper than `readCart()` because it
 *  avoids the include + join. */
export async function readCartItemCount(): Promise<number> {
  const cartId = await getCartId();
  if (!cartId) return 0;
  const agg = await db.cartItem.aggregate({
    where: { cartId },
    _sum: { quantity: true },
  });
  return agg._sum.quantity ?? 0;
}
