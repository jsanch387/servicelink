import { notifyCustomerAppointmentRequestReceived } from '@/features/availability/services/notifyCustomerAppointmentRequestReceived';
import { afterEach, describe, expect, it, vi } from 'vitest';

vi.mock('@/features/email', () => ({
  sendAvailabilityBookingRequestReceivedEmail: vi.fn(),
}));

vi.mock('@/features/sms', () => ({
  buildBookingRequestReceivedSms: vi.fn(() => 'Received SMS'),
  sendAndRecordSms: vi.fn(),
}));

import { sendAvailabilityBookingRequestReceivedEmail } from '@/features/email';
import { sendAndRecordSms } from '@/features/sms';

const base = {
  admin: {} as never,
  businessId: 'biz-1',
  bookingId: 'booking-1',
  customerId: 'cust-1',
  businessName: 'Urban Detailing',
  customerName: 'Request Check',
  customerEmail: 'request-check@example.com',
  customerPhone: '+15125550199',
  serviceName: 'Wash',
  scheduledDate: '2026-12-20',
  startTime: '09:00',
  smsOptIn: true,
};

describe('notifyCustomerAppointmentRequestReceived', () => {
  afterEach(() => {
    vi.clearAllMocks();
  });

  it('emails and texts that the request was received', async () => {
    vi.mocked(sendAvailabilityBookingRequestReceivedEmail).mockResolvedValue({
      sent: true,
    });
    vi.mocked(sendAndRecordSms).mockResolvedValue({
      sent: true,
      messageId: 'sms-1',
    });

    const result = await notifyCustomerAppointmentRequestReceived(base);

    expect(result).toEqual({ email: 'sent', sms: 'sent' });
    expect(sendAvailabilityBookingRequestReceivedEmail).toHaveBeenCalledWith(
      'request-check@example.com',
      expect.objectContaining({
        businessName: 'Urban Detailing',
        serviceName: 'Wash',
        scheduledDate: '2026-12-20',
        startTime: '09:00',
      })
    );
    expect(sendAndRecordSms).toHaveBeenCalledWith(
      expect.objectContaining({
        type: 'booking_request_received',
        to: '+15125550199',
        dedupeKey: 'booking-1:booking_request_received',
        message: 'Received SMS',
      })
    );
  });

  it('skips a missing email and a phone that opted out', async () => {
    const result = await notifyCustomerAppointmentRequestReceived({
      ...base,
      customerEmail: '',
      smsOptIn: false,
    });

    expect(result).toEqual({ email: 'skipped', sms: 'skipped' });
    expect(sendAvailabilityBookingRequestReceivedEmail).not.toHaveBeenCalled();
    expect(sendAndRecordSms).not.toHaveBeenCalled();
  });

  it('reports no phone when none was given', async () => {
    vi.mocked(sendAvailabilityBookingRequestReceivedEmail).mockResolvedValue({
      sent: true,
    });

    const result = await notifyCustomerAppointmentRequestReceived({
      ...base,
      customerPhone: null,
    });

    expect(result).toEqual({ email: 'sent', sms: 'no_phone' });
    expect(sendAndRecordSms).not.toHaveBeenCalled();
  });
});
