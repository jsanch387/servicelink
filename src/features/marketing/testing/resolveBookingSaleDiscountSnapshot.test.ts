import { describe, expect, it, vi } from 'vitest';
import { resolveBookingSaleDiscountSnapshot } from '../server/resolveBookingSaleDiscountSnapshot';

function mockSaleQuery(row: Record<string, unknown> | null) {
  const maybeSingle = vi.fn().mockResolvedValue({ data: row, error: null });
  const eqActive = vi.fn(() => ({ maybeSingle }));
  const eqBusiness = vi.fn(() => ({ eq: eqActive }));
  const select = vi.fn(() => ({ eq: eqBusiness }));
  const from = vi.fn(() => ({ select }));
  return { from } as never;
}

describe('resolveBookingSaleDiscountSnapshot', () => {
  const baseSaleRow = {
    id: 'sale-1',
    business_id: 'biz-1',
    name: 'Mobile Sale 2',
    description: null,
    discount_type: 'fixed_amount',
    discount_value: '25.00',
    starts_at: '2026-07-13T00:00:00.000Z',
    ends_at: '2026-07-27T23:59:59.999Z',
    is_active: true,
    created_at: '2026-07-10T00:00:00.000Z',
    updated_at: '2026-07-10T00:00:00.000Z',
  };

  it('applies an is_active sale when the appointment date is in the window, even if the sale has not started yet (scheduled)', async () => {
    // Booked on July 12 for July 13 — sale starts July 13 00:00 UTC (still "scheduled" by wall clock).
    const snapshot = await resolveBookingSaleDiscountSnapshot(
      mockSaleQuery(baseSaleRow),
      {
        businessId: 'biz-1',
        ownerHasPro: true,
        serviceDateYmd: '2026-07-13',
        subtotalCents: 8500,
      }
    );

    expect(snapshot).toEqual({
      discountSource: 'sale',
      discountSaleId: 'sale-1',
      discountPromoCodeId: null,
      discountType: 'fixed_amount',
      discountValue: 25,
      subtotalCents: 8500,
      discountCents: 2500,
      discountLabel: 'Mobile Sale 2 — $25 off',
    });
  });

  it('does not apply when the appointment date is before the sale window', async () => {
    const snapshot = await resolveBookingSaleDiscountSnapshot(
      mockSaleQuery(baseSaleRow),
      {
        businessId: 'biz-1',
        ownerHasPro: true,
        serviceDateYmd: '2026-07-12',
        subtotalCents: 8500,
      }
    );
    expect(snapshot).toBeNull();
  });

  it('does not apply without Pro', async () => {
    const snapshot = await resolveBookingSaleDiscountSnapshot(
      mockSaleQuery(baseSaleRow),
      {
        businessId: 'biz-1',
        ownerHasPro: false,
        serviceDateYmd: '2026-07-13',
        subtotalCents: 8500,
      }
    );
    expect(snapshot).toBeNull();
  });
});
