import { describe, expect, it } from 'vitest';
import { applyDiscountToSubtotalCents } from '../utils/applyDiscountToSubtotalCents';
import { getServiceSalePriceCents } from '../utils/getServiceSalePriceCents';

describe('applyDiscountToSubtotalCents', () => {
  it('applies percentage discounts with cap at subtotal', () => {
    expect(
      applyDiscountToSubtotalCents(10000, 'percentage', 35)
    ).toEqual({ discountCents: 3500, totalCents: 6500 });
  });

  it('applies fixed discounts in dollars capped at subtotal', () => {
    expect(
      applyDiscountToSubtotalCents(5000, 'fixed_amount', 15)
    ).toEqual({ discountCents: 1500, totalCents: 3500 });
  });

  it('returns no discount for invalid input', () => {
    expect(
      applyDiscountToSubtotalCents(0, 'percentage', 20)
    ).toEqual({ discountCents: 0, totalCents: 0 });
  });
});

describe('getServiceSalePriceCents', () => {
  it('returns null when there is no savings', () => {
    expect(getServiceSalePriceCents(10000, null)).toBeNull();
  });

  it('returns original and sale cents when a sale applies', () => {
    expect(
      getServiceSalePriceCents(10000, {
        discountType: 'percentage',
        discountValue: 20,
      })
    ).toEqual({ originalCents: 10000, saleCents: 8000 });
  });
});
