import { beforeEach, describe, expect, it, vi } from 'vitest';

const {
  resolveBookingPromoDiscountSnapshot,
  resolveBookingSaleDiscountSnapshot,
} = vi.hoisted(() => ({
  resolveBookingPromoDiscountSnapshot: vi.fn(),
  resolveBookingSaleDiscountSnapshot: vi.fn(),
}));

vi.mock(
  '../server/resolveBookingPromoDiscountSnapshot',
  async importOriginal => {
    const actual =
      await importOriginal<
        typeof import('../server/resolveBookingPromoDiscountSnapshot')
      >();
    return {
      ...actual,
      resolveBookingPromoDiscountSnapshot,
    };
  }
);

vi.mock('../server/resolveBookingSaleDiscountSnapshot', () => ({
  resolveBookingSaleDiscountSnapshot,
}));

import { resolveBookingDiscountSnapshot } from '../server/resolveBookingDiscountSnapshot';

describe('resolveBookingDiscountSnapshot', () => {
  const base = {
    businessId: 'biz-1',
    ownerHasPro: true,
    serviceDateYmd: '2026-07-20',
    subtotalCents: 23500,
    customerPhone: '5551234567',
    customerEmail: 'a@example.com',
  };

  beforeEach(() => {
    resolveBookingPromoDiscountSnapshot.mockReset();
    resolveBookingSaleDiscountSnapshot.mockReset();
  });

  it('prefers a valid promo over sale when promo is allowed', async () => {
    resolveBookingPromoDiscountSnapshot.mockResolvedValue({
      ok: true,
      snapshot: {
        discountSource: 'promo',
        discountSaleId: null,
        discountPromoCodeId: 'promo-1',
        discountType: 'percentage',
        discountValue: 20,
        subtotalCents: 23500,
        discountCents: 4700,
        discountLabel: 'SAVE20 — 20% off',
      },
    });

    const result = await resolveBookingDiscountSnapshot({} as never, {
      ...base,
      promoCode: 'SAVE20',
    });

    expect(result).toEqual({
      ok: true,
      snapshot: expect.objectContaining({ discountSource: 'promo' }),
    });
    expect(resolveBookingSaleDiscountSnapshot).not.toHaveBeenCalled();
  });

  it('ignores promo and resolves sale when allowPromoCode is false (owner manual)', async () => {
    resolveBookingSaleDiscountSnapshot.mockResolvedValue({
      discountSource: 'sale',
      discountSaleId: 'sale-1',
      discountPromoCodeId: null,
      discountType: 'percentage',
      discountValue: 20,
      subtotalCents: 23500,
      discountCents: 4700,
      discountLabel: 'Summer Sale — 20% off',
    });

    const result = await resolveBookingDiscountSnapshot({} as never, {
      ...base,
      promoCode: 'SAVE20',
      allowPromoCode: false,
    });

    expect(resolveBookingPromoDiscountSnapshot).not.toHaveBeenCalled();
    expect(resolveBookingSaleDiscountSnapshot).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({
        businessId: 'biz-1',
        serviceDateYmd: '2026-07-20',
        subtotalCents: 23500,
      })
    );
    expect(result).toEqual({
      ok: true,
      snapshot: expect.objectContaining({
        discountSource: 'sale',
        discountSaleId: 'sale-1',
        discountCents: 4700,
      }),
    });
  });

  it('returns null snapshot when no sale qualifies on owner path', async () => {
    resolveBookingSaleDiscountSnapshot.mockResolvedValue(null);

    const result = await resolveBookingDiscountSnapshot({} as never, {
      ...base,
      allowPromoCode: false,
    });

    expect(result).toEqual({ ok: true, snapshot: null });
  });
});
