import { describe, expect, it, vi } from 'vitest';
import { recordPromoCodeRedemptionForCompletedBooking } from '../server/recordPromoCodeRedemptionForCompletedBooking';

function mockDb(opts: {
  existing?: { id: string } | null;
  insertError?: { code?: string } | null;
}) {
  const maybeSingle = vi.fn().mockResolvedValue({
    data: opts.existing ?? null,
    error: null,
  });
  const insert = vi.fn().mockResolvedValue({
    error: opts.insertError ?? null,
  });
  const eq = vi.fn(() => ({ maybeSingle }));
  const select = vi.fn(() => ({ eq }));
  const from = vi.fn(() => ({ select, insert }));
  return { from, insert, select, eq, maybeSingle };
}

describe('recordPromoCodeRedemptionForCompletedBooking', () => {
  it('skips when discount source is not promo', async () => {
    const db = mockDb({});
    const result = await recordPromoCodeRedemptionForCompletedBooking(
      { from: db.from } as never,
      {
        id: 'b1',
        business_id: 'biz1',
        discount_source: 'sale',
        discount_promo_code_id: 'p1',
      }
    );
    expect(result).toEqual({ recorded: false, reason: 'not_promo' });
    expect(db.from).not.toHaveBeenCalled();
  });

  it('inserts redemption for promo booking', async () => {
    const db = mockDb({ existing: null });
    const result = await recordPromoCodeRedemptionForCompletedBooking(
      { from: db.from } as never,
      {
        id: 'b1',
        business_id: 'biz1',
        discount_source: 'promo',
        discount_promo_code_id: 'p1',
        customer_phone: '(555) 123-4567',
        customer_email: 'A@B.com',
      }
    );
    expect(result).toEqual({ recorded: true });
    expect(db.insert).toHaveBeenCalledWith(
      expect.objectContaining({
        promo_code_id: 'p1',
        booking_id: 'b1',
        business_id: 'biz1',
        customer_phone_normalized: '5551234567',
        customer_email_normalized: 'a@b.com',
      })
    );
  });

  it('is idempotent when redemption already exists for booking', async () => {
    const db = mockDb({ existing: { id: 'r1' } });
    const result = await recordPromoCodeRedemptionForCompletedBooking(
      { from: db.from } as never,
      {
        id: 'b1',
        business_id: 'biz1',
        discount_source: 'promo',
        discount_promo_code_id: 'p1',
      }
    );
    expect(result).toEqual({ recorded: false, reason: 'already_recorded' });
    expect(db.insert).not.toHaveBeenCalled();
  });
});
