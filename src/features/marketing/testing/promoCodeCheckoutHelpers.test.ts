import { describe, expect, it } from 'vitest';
import {
  isValidPromoCodeFormat,
  normalizeEnteredPromoCode,
} from '../server/resolveBookingPromoDiscountSnapshot';
import { bookingDiscountColumnsFromSnapshot } from '../server/bookingDiscountSnapshot';
import type { BookingDiscountSnapshot } from '../server/bookingDiscountSnapshot';

describe('normalizeEnteredPromoCode', () => {
  it('trims and uppercases', () => {
    expect(normalizeEnteredPromoCode('  save20 ')).toBe('SAVE20');
  });
});

describe('isValidPromoCodeFormat', () => {
  it('accepts alphanumeric codes', () => {
    expect(isValidPromoCodeFormat('SAVE20')).toBe(true);
  });

  it('rejects empty or invalid characters', () => {
    expect(isValidPromoCodeFormat('')).toBe(false);
    expect(isValidPromoCodeFormat('SAVE-20')).toBe(false);
  });
});

describe('bookingDiscountColumnsFromSnapshot', () => {
  it('maps promo snapshot columns', () => {
    const snapshot: BookingDiscountSnapshot = {
      discountSource: 'promo',
      discountSaleId: null,
      discountPromoCodeId: 'promo-1',
      discountType: 'percentage',
      discountValue: 20,
      subtotalCents: 10000,
      discountCents: 2000,
      discountLabel: 'SAVE20 — 20% off',
    };
    expect(bookingDiscountColumnsFromSnapshot(snapshot)).toEqual({
      discount_source: 'promo',
      discount_sale_id: null,
      discount_promo_code_id: 'promo-1',
      discount_type: 'percentage',
      discount_value: 20,
      subtotal_cents: 10000,
      discount_cents: 2000,
      discount_label: 'SAVE20 — 20% off',
    });
  });

  it('clears columns when snapshot is null', () => {
    expect(bookingDiscountColumnsFromSnapshot(null).discount_source).toBeNull();
  });
});
