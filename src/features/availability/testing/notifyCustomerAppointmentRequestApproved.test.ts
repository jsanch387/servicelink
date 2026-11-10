import { notifyCustomerAppointmentRequestApproved } from '@/features/availability/services/notifyCustomerAppointmentRequestApproved';
import type { BookingRow } from '@/features/availability/booking/dashboard/utils/mapBookingRowToDisplay';
import { afterEach, describe, expect, it, vi } from 'vitest';

vi.mock('@/features/email', () => ({
  sendAvailabilityBookingCustomerConfirmationEmail: vi.fn(),
}));

vi.mock('@/features/sms', () => ({
  buildBookingRequestApprovedSms: vi.fn(() => 'Approved SMS'),
  sendAndRecordSms: vi.fn(),
}));

vi.mock('@/libs/supabase/admin', () => ({
  createSupabaseAdminClient: vi.fn(() => ({})),
}));

import { sendAvailabilityBookingCustomerConfirmationEmail } from '@/features/email';
import { sendAndRecordSms } from '@/features/sms';

function booking(overrides: Partial<BookingRow> = {}): BookingRow {
  return {
    id: 'booking-1',
    business_id: 'biz-1',
    business_slug: null,
    service_id: null,
    service_name: 'Wash',
    service_price_cents: 0,
    addon_details: [],
    duration_minutes: 60,
    scheduled_date: '2026-12-20',
    start_time: '09:00:00',
    customer_name: 'Request Check',
    customer_email: 'request-check@example.com',
    customer_phone: '+15125550199',
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

describe('notifyCustomerAppointmentRequestApproved', () => {
  afterEach(() => {
    vi.clearAllMocks();
  });

  it('emails and texts when both contacts exist', async () => {
    vi.mocked(
      sendAvailabilityBookingCustomerConfirmationEmail
    ).mockResolvedValue({ sent: true });
    vi.mocked(sendAndRecordSms).mockResolvedValue({
      sent: true,
      messageId: 'sms-1',
    });

    const result = await notifyCustomerAppointmentRequestApproved(
      supabaseWithBusiness() as never,
      booking()
    );

    expect(result).toEqual({ email: 'sent', sms: 'sent' });
    expect(
      sendAvailabilityBookingCustomerConfirmationEmail
    ).toHaveBeenCalledWith(
      'request-check@example.com',
      'Urban Detailing',
      expect.objectContaining({
        customerName: 'Request Check',
        scheduledDate: '2026-12-20',
        startTime: '09:00',
      })
    );
    expect(sendAndRecordSms).toHaveBeenCalledWith(
      expect.objectContaining({
        type: 'booking_request_approved',
        to: '+15125550199',
        dedupeKey: 'booking-1:booking_request_approved',
        message: 'Approved SMS',
      })
    );
  });

  it('skips a channel when that contact is missing', async () => {
    vi.mocked(
      sendAvailabilityBookingCustomerConfirmationEmail
    ).mockResolvedValue({ sent: true });

    const result = await notifyCustomerAppointmentRequestApproved(
      supabaseWithBusiness() as never,
      booking({ customer_phone: null, customer_email: '' })
    );

    expect(result).toEqual({ email: 'skipped', sms: 'skipped' });
    expect(
      sendAvailabilityBookingCustomerConfirmationEmail
    ).not.toHaveBeenCalled();
    expect(sendAndRecordSms).not.toHaveBeenCalled();
  });
});
