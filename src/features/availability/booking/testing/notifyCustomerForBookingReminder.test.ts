import { notifyCustomerForBookingReminder } from '@/features/availability/booking/server/reminders/notifyCustomerForBookingReminder';
import { afterEach, describe, expect, it, vi } from 'vitest';

vi.mock('@/features/email', () => ({
  sendAvailabilityBookingReminderEmail: vi.fn(),
}));

vi.mock('@/features/sms', () => ({
  buildBookingReminderSms: vi.fn(() => 'Reminder SMS'),
  sendAndRecordSms: vi.fn(),
}));

import { sendAvailabilityBookingReminderEmail } from '@/features/email';
import { sendAndRecordSms } from '@/features/sms';

const base = {
  bookingId: 'b1',
  businessId: 'biz-1',
  businessName: 'Urban Detailing',
  scheduledDate: '2026-08-21',
  startTime: '14:30',
  serviceName: 'Wash',
  customerName: 'Jose',
  customerId: 'cust-1',
};

describe('notifyCustomerForBookingReminder', () => {
  afterEach(() => {
    vi.clearAllMocks();
  });

  it('skips both channels when no email or phone', async () => {
    const result = await notifyCustomerForBookingReminder({} as never, {
      ...base,
      customerEmail: null,
      customerPhone: null,
    });

    expect(result).toEqual({ email: 'skipped', sms: 'skipped' });
    expect(sendAvailabilityBookingReminderEmail).not.toHaveBeenCalled();
    expect(sendAndRecordSms).not.toHaveBeenCalled();
  });

  it('emails and texts when both contacts exist', async () => {
    vi.mocked(sendAvailabilityBookingReminderEmail).mockResolvedValue({
      sent: true,
    });
    vi.mocked(sendAndRecordSms).mockResolvedValue({
      sent: true,
      messageId: 'sms-1',
    });

    const result = await notifyCustomerForBookingReminder({} as never, {
      ...base,
      customerEmail: 'jose@example.com',
      customerPhone: '+15555550100',
    });

    expect(result).toEqual({ email: 'sent', sms: 'sent' });
    expect(sendAvailabilityBookingReminderEmail).toHaveBeenCalledWith(
      'jose@example.com',
      expect.objectContaining({
        businessName: 'Urban Detailing',
        scheduledDate: '2026-08-21',
      })
    );
    expect(sendAndRecordSms).toHaveBeenCalledWith(
      expect.objectContaining({
        type: 'booking_reminder',
        bookingId: 'b1',
        to: '+15555550100',
        dedupeKey: 'b1:booking_reminder:2026-08-21',
      })
    );
  });

  it('sends email only when there is no phone', async () => {
    vi.mocked(sendAvailabilityBookingReminderEmail).mockResolvedValue({
      sent: true,
    });

    const result = await notifyCustomerForBookingReminder({} as never, {
      ...base,
      customerEmail: 'jose@example.com',
      customerPhone: null,
    });

    expect(result).toEqual({ email: 'sent', sms: 'skipped' });
    expect(sendAndRecordSms).not.toHaveBeenCalled();
  });
});
