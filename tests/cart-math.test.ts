import { TAX_RATE_BPS, applyPromoCode, computeCartTotals } from '@/lib/cart-math';
import { describe, expect, it } from 'vitest';

describe('computeCartTotals', () => {
  it('returns all zeros on an empty cart', () => {
    const totals = computeCartTotals([]);
    expect(totals).toEqual({
      subtotalCents: 0,
      taxCents: 0,
      totalCents: 0,
      itemCount: 0,
    });
  });

  it('multiplies unit price by quantity per line', () => {
    const totals = computeCartTotals([
      { quantity: 2, unitPriceCents: 1000 },
      { quantity: 1, unitPriceCents: 2500 },
    ]);
    expect(totals.subtotalCents).toBe(4500);
    expect(totals.itemCount).toBe(3);
  });

  it('applies a single-pass tax on the subtotal, not per-line', () => {
    // 4500 * 0.13 = 585 — should not be 200 + 325 + 65 (per-line rounding).
    const totals = computeCartTotals([{ quantity: 3, unitPriceCents: 1500 }]);
    expect(totals.subtotalCents).toBe(4500);
    expect(totals.taxCents).toBe(Math.round((4500 * TAX_RATE_BPS) / 10_000));
    expect(totals.totalCents).toBe(totals.subtotalCents + totals.taxCents);
  });

  it('rounds tax to the nearest cent (half-up via Math.round)', () => {
    // 1999 * 0.13 = 259.87 → 260.
    const totals = computeCartTotals([{ quantity: 1, unitPriceCents: 1999 }]);
    expect(totals.taxCents).toBe(260);
    expect(totals.totalCents).toBe(2259);
  });

  it('handles a realistic 3-line bookstore basket end-to-end', () => {
    const totals = computeCartTotals([
      { quantity: 1, unitPriceCents: 2495 }, // The Overstory
      { quantity: 2, unitPriceCents: 1495 }, // 2× Meditations
      { quantity: 1, unitPriceCents: 1395 }, // The Waste Land
    ]);
    expect(totals.subtotalCents).toBe(2495 + 2 * 1495 + 1395); // 6880
    expect(totals.itemCount).toBe(4);
    expect(totals.taxCents).toBe(Math.round((6880 * 1300) / 10_000)); // 894
    expect(totals.totalCents).toBe(6880 + 894);
  });
});

describe('applyPromoCode', () => {
  it('returns zero discount for undefined / unknown codes', () => {
    expect(applyPromoCode(10_000, undefined)).toEqual({
      discountCents: 0,
      appliedCode: null,
    });
    expect(applyPromoCode(10_000, 'NOPE')).toEqual({
      discountCents: 0,
      appliedCode: null,
    });
  });

  it('applies 10% off for HELM10 regardless of case / surrounding whitespace', () => {
    expect(applyPromoCode(10_000, 'helm10')).toEqual({
      discountCents: 1000,
      appliedCode: 'HELM10',
    });
    expect(applyPromoCode(10_000, '  HELM10 ')).toEqual({
      discountCents: 1000,
      appliedCode: 'HELM10',
    });
  });
});
