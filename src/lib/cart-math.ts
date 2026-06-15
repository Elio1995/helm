// Pure cart math. Kept in its own module so it can be unit-tested without
// pulling in Prisma, Next, or Stripe. All amounts are integer cents — never
// floats. Currency conversion is out of scope; everything is CAD.

export interface CartLineLike {
  quantity: number;
  unitPriceCents: number;
}

export interface CartTotals {
  subtotalCents: number;
  taxCents: number;
  totalCents: number;
  itemCount: number;
}

/** Flat 13% tax stub — matches Ontario HST so the demo number reads naturally.
 *  In a real deployment this would route through Stripe Tax or TaxJar. */
export const TAX_RATE_BPS = 1300; // 13.00% in basis points

/** Compute totals from a set of cart lines.
 *  Taxes are computed on the subtotal as a single line — not per-item — to
 *  avoid the off-by-one penny errors you get from per-item rounding.
 */
export function computeCartTotals(lines: readonly CartLineLike[]): CartTotals {
  let subtotalCents = 0;
  let itemCount = 0;

  for (const line of lines) {
    subtotalCents += line.quantity * line.unitPriceCents;
    itemCount += line.quantity;
  }

  // Integer cents arithmetic with rounding at the boundary.
  const taxCents = Math.round((subtotalCents * TAX_RATE_BPS) / 10_000);
  const totalCents = subtotalCents + taxCents;

  return { subtotalCents, taxCents, totalCents, itemCount };
}

/** Discount stub. Returns the discount in cents (always non-negative). */
export function applyPromoCode(
  subtotalCents: number,
  code: string | undefined,
): { discountCents: number; appliedCode: string | null } {
  if (!code) return { discountCents: 0, appliedCode: null };
  const normalized = code.trim().toUpperCase();
  if (normalized === 'HELM10') {
    return {
      discountCents: Math.round(subtotalCents * 0.1),
      appliedCode: 'HELM10',
    };
  }
  return { discountCents: 0, appliedCode: null };
}
