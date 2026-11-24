import { denyRequestedBooking } from '@/features/availability/services/denyRequestedBooking';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const notify = vi.hoisted(() => vi.fn(async () => undefined));
const expire = vi.hoisted(() => vi.fn(async () => ({ expired: 1 })));

vi.mock(
  '@/features/availability/services/notifyCustomerAppointmentRequestDenied',
  () => ({
    notifyCustomerAppointmentRequestDenied: notify,
  })
);

vi.mock(
  '@/features/availability/services/expirePastAppointmentRequests',
  () => ({
    appointmentRequestExpiryDate: () => '2026-11-09',
    expirePastAppointmentRequests: expire,
  })
);

const requestedRow = {
  id: 'booking-1',
  business_id: 'biz-1',
  status: 'requested',
  scheduled_date: '2026-12-20',
  customer_name: 'Request Check',
};

function client(options: {
  updated?: typeof requestedRow | null;
  existing?: Record<string, unknown> | null;
}) {
  const update = vi.fn();
  const updateChain = {
    eq: vi.fn(() => updateChain),
    gte: vi.fn(() => updateChain),
    select: vi.fn(() => updateChain),
    maybeSingle: vi.fn(async () => ({
      data: options.updated ?? null,
      error: null,
    })),
  };
  update.mockReturnValue(updateChain);
  const loadChain = {
    eq: vi.fn(() => loadChain),
    maybeSingle: vi.fn(async () => ({
      data: options.existing ?? null,
      error: null,
    })),
  };
  return {
    update,
    from: vi.fn((table: string) => {
      if (table !== 'bookings') throw new Error(table);
      return {
        update,
        select: vi.fn(() => loadChain),
      };
    }),
  };
}

describe('denyRequestedBooking', () => {
  beforeEach(() => {
    notify.mockClear();
    expire.mockClear();
  });

  it('cancels a request and notifies the customer once', async () => {
    const supabase = client({ updated: requestedRow });

    const result = await denyRequestedBooking(supabase as never, {
      businessId: 'biz-1',
      bookingId: 'booking-1',
    });

    expect(result).toEqual({
      handled: true,
      ok: true,
      row: requestedRow,
    });
    expect(supabase.update).toHaveBeenCalledWith({ status: 'cancelled' });
    expect(notify).toHaveBeenCalledTimes(1);
  });

  it('does not notify again when the request is already cancelled', async () => {
    const existing = { ...requestedRow, status: 'cancelled' };
    const supabase = client({ updated: null, existing });

    const result = await denyRequestedBooking(supabase as never, {
      businessId: 'biz-1',
      bookingId: 'booking-1',
    });

    expect(result).toEqual({ handled: true, ok: true, row: existing });
    expect(notify).not.toHaveBeenCalled();
  });

  it('leaves a confirmed appointment for the normal cancel path', async () => {
    const supabase = client({
      updated: null,
      existing: { ...requestedRow, status: 'confirmed' },
    });

    const result = await denyRequestedBooking(supabase as never, {
      businessId: 'biz-1',
      bookingId: 'booking-1',
    });

    expect(result).toEqual({ handled: false });
    expect(notify).not.toHaveBeenCalled();
  });

  it('expires a request whose day has passed instead of denying it', async () => {
    const supabase = client({
      updated: null,
      existing: {
        ...requestedRow,
        status: 'requested',
        scheduled_date: '2026-11-01',
      },
    });

    const result = await denyRequestedBooking(supabase as never, {
      businessId: 'biz-1',
      bookingId: 'booking-1',
    });

    expect(result).toEqual({
      handled: true,
      ok: false,
      error: 'This request expired.',
      httpStatus: 409,
    });
    expect(expire).toHaveBeenCalledTimes(1);
    expect(notify).not.toHaveBeenCalled();
  });
});
