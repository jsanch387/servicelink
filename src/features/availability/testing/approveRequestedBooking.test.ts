import { approveRequestedBooking } from '@/features/availability/services/approveRequestedBooking';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const notify = vi.hoisted(() =>
  vi.fn(async () => ({ email: 'sent', sms: 'sent' }))
);

vi.mock(
  '@/features/availability/services/notifyCustomerAppointmentRequestApproved',
  () => ({
    notifyCustomerAppointmentRequestApproved: notify,
  })
);

const requestedRow = {
  id: 'booking-1',
  business_id: 'biz-1',
  status: 'requested',
  customer_name: 'Request Check',
};

function client(options: {
  updated?: typeof requestedRow | null;
  existing?: Record<string, unknown> | null;
}) {
  const updateChain = {
    eq: vi.fn(() => updateChain),
    gte: vi.fn(() => updateChain),
    select: vi.fn(() => updateChain),
    maybeSingle: vi.fn(async () => ({
      data: options.updated ?? null,
      error: null,
    })),
  };
  const loadChain = {
    eq: vi.fn(() => loadChain),
    maybeSingle: vi.fn(async () => ({
      data: options.existing ?? null,
      error: null,
    })),
  };
  return {
    from: vi.fn((table: string) => {
      if (table !== 'bookings') throw new Error(table);
      return {
        update: vi.fn(() => updateChain),
        select: vi.fn(() => loadChain),
      };
    }),
  };
}

describe('approveRequestedBooking', () => {
  beforeEach(() => {
    notify.mockClear();
  });

  it('confirms a request and notifies the customer once', async () => {
    const supabase = client({ updated: requestedRow });

    const result = await approveRequestedBooking(supabase as never, {
      businessId: 'biz-1',
      bookingId: 'booking-1',
    });

    expect(result.ok).toBe(true);
    expect(notify).toHaveBeenCalledTimes(1);
  });

  it('does not notify again when the appointment is already confirmed', async () => {
    const supabase = client({
      updated: null,
      existing: { ...requestedRow, status: 'confirmed' },
    });

    const result = await approveRequestedBooking(supabase as never, {
      businessId: 'biz-1',
      bookingId: 'booking-1',
    });

    expect(result.ok).toBe(true);
    expect(notify).not.toHaveBeenCalled();
  });

  it('rejects a booking that is not a request', async () => {
    const supabase = client({
      updated: null,
      existing: { ...requestedRow, status: 'cancelled' },
    });

    const result = await approveRequestedBooking(supabase as never, {
      businessId: 'biz-1',
      bookingId: 'booking-1',
    });

    expect(result).toEqual({
      ok: false,
      error: 'Only a request can be approved.',
      httpStatus: 409,
    });
    expect(notify).not.toHaveBeenCalled();
  });
});
