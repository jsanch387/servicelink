import { notifyCustomerAvailabilityBookingRescheduled } from '@/features/availability/services/notifyCustomerAvailabilityBookingRescheduled';
import type { BookingRow } from '@/features/availability/booking/dashboard/utils/mapBookingRowToDisplay';
import { afterEach, describe, expect, it, vi } from 'vitest';

vi.mock(
  '@/features/email/availability-booking-rescheduled/sendAvailabilityBookingRescheduledEmail',
  () => ({
    sendAvailabilityBookingRescheduledEmail: vi.fn(),
  })
);

vi.mock('@/features/sms', () => ({
  buildBookingRescheduledSms: vi.fn(() => 'Rescheduled SMS'),
  sendAndRecordSms: vi.fn(),
}));

vi.mock('@/libs/supabase/admin', () => ({
  createSupabaseAdminClient: vi.fn(() => ({})),
}));

import { sendAvailabilityBookingRescheduledEmail } from '@/features/email/availability-booking-rescheduled/sendAvailabilityBookingRescheduledEmail';
import { sendAndRecordSms } from '@/features/sms';
import { createSupabaseAdminClient } from '@/libs/supabase/admin';

function booking(overrides: Partial<BookingRow> = {}): BookingRow {
  return {
    id: 'booking-1',
    business_id: 'biz-1',
    business_slug: null,
    service_id: null,
    service_name: 'Wash',
    service_price_cents: 5000,
    addon_details: [],
    duration_minutes: 60,
    scheduled_date: '2026-06-12',
    start_time: '14:00:00',
    customer_name: 'Pat',
    customer_email: 'pat@example.com',
    customer_phone: '+15555550100',
    customer_street_address: null,
    customer_unit_apt: null,
    customer_city: null,
    customer_state: null,
    customer_zip: null,
    customer_vehicle_year: null,
    customer_vehicle_make: null,
    customer_vehicle_model: null,
    customer_notes: null,
    customer_id: 'cust-1',
    status: 'confirmed',
    created_at: '2026-01-01T00:00:00.000Z',
    updated_at: '2026-01-01T00:00:00.000Z',
    ...overrides,
  };
}

function supabaseWithBusiness() {
  return {
    from: () => ({
      select: () => ({
        eq: () => ({
          maybeSingle: async () => ({
            data: { business_name: 'Urban Detailing', business_slug: 'urban' },
            error: null,
          }),
        }),
      }),
    }),
  };
}

describe('notifyCustomerAvailabilityBookingRescheduled', () => {
  afterEach(() => {
    vi.clearAllMocks();
    vi.mocked(createSupabaseAdminClient).mockReturnValue({} as never);
  });

  it('emails and texts when both contacts exist', async () => {
    vi.mocked(sendAvailabilityBookingRescheduledEmail).mockResolvedValue({
      sent: true,
    });
    vi.mocked(sendAndRecordSms).mockResolvedValue({
      sent: true,
      messageId: 'sms-1',
    });

    const result = await notifyCustomerAvailabilityBookingRescheduled(
      supabaseWithBusiness() as never,
      {
        booking: booking(),
        previousScheduledDate: '2026-06-10',
        previousStartTime: '09:00:00',
      }
    );

    expect(result).toEqual({ email: 'sent', sms: 'sent' });
    expect(sendAvailabilityBookingRescheduledEmail).toHaveBeenCalledWith(
      'pat@example.com',
      expect.objectContaining({
        businessName: 'Urban Detailing',
        scheduledDate: '2026-06-12',
        startTime: '14:00',
        previousScheduledDate: '2026-06-10',
        previousStartTime: '09:00',
      })
    );
    expect(sendAndRecordSms).toHaveBeenCalledWith(
      expect.objectContaining({
        type: 'booking_rescheduled',
        bookingId: 'booking-1',
        customerId: 'cust-1',
        to: '+15555550100',
        dedupeKey:
          'booking-1:booking_rescheduled:2026-06-10T09:00:2026-06-12T14:00',
      })
    );
  });

  it('emails the service name without the pricing option', async () => {
    vi.mocked(sendAvailabilityBookingRescheduledEmail).mockResolvedValue({
      sent: true,
    });

    await notifyCustomerAvailabilityBookingRescheduled(
      supabaseWithBusiness() as never,
      {
        booking: booking({
          customer_phone: null,
          service_name: 'Full Interior Detail — Large SUV',
          job_details: [
            {
              serviceName: 'Full Interior Detail',
              servicePriceOptionLabel: 'Large SUV',
              servicePriceCents: 12000,
              durationMinutes: 90,
              selectedAddOns: [],
            },
          ],
        }),
        previousScheduledDate: '2026-06-10',
        previousStartTime: '09:00',
      }
    );

    expect(sendAvailabilityBookingRescheduledEmail).toHaveBeenCalledWith(
      'pat@example.com',
      expect.objectContaining({ serviceName: 'Full Interior Detail' })
    );
  });

  it('sends email only when there is no phone', async () => {
    vi.mocked(sendAvailabilityBookingRescheduledEmail).mockResolvedValue({
      sent: true,
    });

    const result = await notifyCustomerAvailabilityBookingRescheduled(
      supabaseWithBusiness() as never,
      {
        booking: booking({ customer_phone: null }),
        previousScheduledDate: '2026-06-10',
        previousStartTime: '09:00',
      }
    );

    expect(result).toEqual({ email: 'sent', sms: 'skipped' });
    expect(sendAndRecordSms).not.toHaveBeenCalled();
  });

  it('skips both channels when there is no contact', async () => {
    const result = await notifyCustomerAvailabilityBookingRescheduled(
      supabaseWithBusiness() as never,
      {
        booking: booking({ customer_email: null, customer_phone: null }),
        previousScheduledDate: '2026-06-10',
        previousStartTime: '09:00',
      }
    );

    expect(result).toEqual({ email: 'skipped', sms: 'skipped' });
    expect(sendAvailabilityBookingRescheduledEmail).not.toHaveBeenCalled();
    expect(sendAndRecordSms).not.toHaveBeenCalled();
  });

  it('still emails when the admin client for SMS is unavailable', async () => {
    vi.mocked(createSupabaseAdminClient).mockImplementation(() => {
      throw new Error('missing service key');
    });
    vi.mocked(sendAvailabilityBookingRescheduledEmail).mockResolvedValue({
      sent: true,
    });

    const result = await notifyCustomerAvailabilityBookingRescheduled(
      supabaseWithBusiness() as never,
      {
        booking: booking(),
        previousScheduledDate: '2026-06-10',
        previousStartTime: '09:00',
      }
    );

    expect(result).toEqual({ email: 'sent', sms: 'skipped' });
    expect(sendAndRecordSms).not.toHaveBeenCalled();
  });
});
