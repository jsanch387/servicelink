import type { BookingRow } from '@/features/availability/booking/dashboard/utils/mapBookingRowToDisplay';
import * as validateSlot from '@/features/availability/booking/server/validateOwnerBookingSlot';
import { rescheduleBookingForOwner } from '@/features/availability/services/bookingService';
import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock(
  '@/features/availability/booking/server/validateOwnerBookingSlot',
  async importOriginal => {
    const mod =
      await importOriginal<
        typeof import('@/features/availability/booking/server/validateOwnerBookingSlot')
      >();
    return {
      ...mod,
      validateOwnerBookingSlot: vi.fn(),
    };
  }
);

function minimalConfirmedRow(overrides: Partial<BookingRow> = {}): BookingRow {
  return {
    id: 'booking-1',
    business_id: 'biz-1',
    business_slug: null,
    service_id: null,
    service_name: 'Wash',
    service_price_cents: 5000,
    addon_details: [],
    duration_minutes: 60,
    scheduled_date: '2026-06-10',
    start_time: '09:00:00',
    customer_name: 'Pat',
    customer_email: 'p@example.com',
    customer_phone: null,
    customer_street_address: null,
    customer_unit_apt: null,
    customer_city: null,
    customer_state: null,
    customer_zip: null,
    customer_vehicle_year: null,
    customer_vehicle_make: null,
    customer_vehicle_model: null,
    customer_notes: null,
    customer_id: null,
    status: 'confirmed',
    created_at: '2026-01-01T00:00:00.000Z',
    updated_at: '2026-01-01T00:00:00.000Z',
    ...overrides,
  };
}

function createTwoPhaseBookingsMock(
  loadRow: BookingRow | null,
  loadError: Error | null,
  updatedRow: BookingRow | null,
  updateError: Error | null
) {
  let phase = 0;
  return {
    from: vi.fn(() => {
      phase += 1;
      if (phase === 1) {
        return {
          select: () => ({
            eq: () => ({
              eq: () => ({
                maybeSingle: vi
                  .fn()
                  .mockResolvedValue({ data: loadRow, error: loadError }),
              }),
            }),
          }),
        };
      }
      return {
        update: () => ({
          eq: () => ({
            eq: () => ({
              eq: () => ({
                select: () => ({
                  maybeSingle: vi.fn().mockResolvedValue({
                    data: updatedRow,
                    error: updateError,
                  }),
                }),
              }),
            }),
          }),
        }),
      };
    }),
  };
}

describe('rescheduleBookingForOwner', () => {
  const validateSpy = vi.mocked(validateSlot.validateOwnerBookingSlot);

  beforeEach(() => {
    vi.clearAllMocks();
    validateSpy.mockResolvedValue({ ok: true });
  });

  it('returns updated row when load, validation, and update succeed', async () => {
    const loaded = minimalConfirmedRow();
    const updated = minimalConfirmedRow({
      scheduled_date: '2026-06-12',
      start_time: '14:00:00',
    });
    const supabase = createTwoPhaseBookingsMock(loaded, null, updated, null);

    const result = await rescheduleBookingForOwner(supabase as never, {
      businessId: 'biz-1',
      bookingId: 'booking-1',
      scheduledDate: '2026-06-12',
      startTimeHHmm: '14:00',
    });

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.row.scheduled_date).toBe('2026-06-12');
      expect(result.row.start_time).toContain('14:00');
    }
    expect(validateSpy).toHaveBeenCalledWith(
      supabase,
      expect.objectContaining({
        businessId: 'biz-1',
        scheduledDate: '2026-06-12',
        startTimeHHmm: '14:00',
        durationMinutes: 60,
        excludeBookingId: 'booking-1',
      })
    );
  });

  it('returns 404 when booking is missing', async () => {
    const supabase = createTwoPhaseBookingsMock(null, null, null, null);
    const result = await rescheduleBookingForOwner(supabase as never, {
      businessId: 'biz-1',
      bookingId: 'missing',
      scheduledDate: '2026-06-12',
      startTimeHHmm: '10:00',
    });
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.httpStatus).toBe(404);
      expect(result.error).toMatch(/not found/i);
    }
    expect(validateSpy).not.toHaveBeenCalled();
  });

  it('returns 409 when booking is not confirmed', async () => {
    const supabase = createTwoPhaseBookingsMock(
      minimalConfirmedRow({ status: 'cancelled' }),
      null,
      null,
      null
    );
    const result = await rescheduleBookingForOwner(supabase as never, {
      businessId: 'biz-1',
      bookingId: 'booking-1',
      scheduledDate: '2026-06-12',
      startTimeHHmm: '10:00',
    });
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.httpStatus).toBe(409);
      expect(result.error).toMatch(/confirmed/i);
    }
    expect(validateSpy).not.toHaveBeenCalled();
  });

  it('returns 409 with validation message when slot check fails', async () => {
    validateSpy.mockResolvedValue({
      ok: false,
      code: 'existing_booking_conflict',
    });
    const supabase = createTwoPhaseBookingsMock(
      minimalConfirmedRow(),
      null,
      null,
      null
    );
    const result = await rescheduleBookingForOwner(supabase as never, {
      businessId: 'biz-1',
      bookingId: 'booking-1',
      scheduledDate: '2026-06-12',
      startTimeHHmm: '10:00',
    });
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.httpStatus).toBe(409);
      expect(result.error).toContain('booked');
    }
  });

  it('returns 409 when update affects zero rows', async () => {
    const supabase = createTwoPhaseBookingsMock(
      minimalConfirmedRow(),
      null,
      null,
      null
    );
    const result = await rescheduleBookingForOwner(supabase as never, {
      businessId: 'biz-1',
      bookingId: 'booking-1',
      scheduledDate: '2026-06-12',
      startTimeHHmm: '11:00',
    });
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.httpStatus).toBe(409);
      expect(result.error).toMatch(/no longer confirmed|removed/i);
    }
  });
});
