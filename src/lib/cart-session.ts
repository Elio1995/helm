// Cart session — keyed by an anonymous, signed cookie. There is no user.
//
// The cookie holds the cart's id and an HMAC over it. We don't need a JWT
// library here: the payload is a single opaque CUID and we sign it with
// CART_SESSION_SECRET. This avoids carrying a 50KB dependency for a one-shot
// signature check.

import 'server-only';

import { createHmac, timingSafeEqual } from 'node:crypto';
import { db } from '@/lib/db';
import { cookies } from 'next/headers';

export const CART_COOKIE = 'helm_cart';
const MAX_AGE_SECONDS = 60 * 60 * 24 * 30; // 30 days

function sign(value: string): string {
  const secret = process.env.CART_SESSION_SECRET ?? 'helm-dev-secret-do-not-use-in-prod';
  return createHmac('sha256', secret).update(value).digest('base64url');
}

function verify(value: string, signature: string): boolean {
  const expected = sign(value);
  const a = Buffer.from(expected);
  const b = Buffer.from(signature);
  if (a.length !== b.length) return false;
  return timingSafeEqual(a, b);
}

function encode(cartId: string): string {
  return `${cartId}.${sign(cartId)}`;
}

function decode(raw: string): string | null {
  const dot = raw.indexOf('.');
  if (dot < 0) return null;
  const cartId = raw.slice(0, dot);
  const signature = raw.slice(dot + 1);
  if (!cartId || !signature) return null;
  if (!verify(cartId, signature)) return null;
  return cartId;
}

/** Read the cart id from the request cookies, if one exists and the signature
 *  verifies. Returns null otherwise — call `ensureCart()` to create one. */
export async function getCartId(): Promise<string | null> {
  const store = await cookies();
  const cookie = store.get(CART_COOKIE);
  if (!cookie) return null;
  return decode(cookie.value);
}

/** Get or create the cart row for the current visitor. Always returns a cart;
 *  side-effects the response cookie if the cart had to be created. */
export async function ensureCart(): Promise<{ id: string }> {
  const existing = await getCartId();
  if (existing) {
    // Double-check the row still exists (could have been pruned).
    const row = await db.cart.findUnique({ where: { id: existing }, select: { id: true } });
    if (row) return row;
  }

  const cart = await db.cart.create({ data: {}, select: { id: true } });
  const store = await cookies();
  store.set(CART_COOKIE, encode(cart.id), {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge: MAX_AGE_SECONDS,
  });

  return cart;
}

/** Clear the cart cookie (used after successful checkout). */
export async function clearCartCookie(): Promise<void> {
  const store = await cookies();
  store.delete(CART_COOKIE);
}
