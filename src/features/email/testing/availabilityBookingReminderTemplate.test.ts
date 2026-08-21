import {
  buildAvailabilityBookingReminderHtml,
  buildAvailabilityBookingReminderPlainText,
  getAvailabilityBookingReminderSubject,
} from '@/features/email/availability-booking-reminder/availabilityBookingReminderTemplate';
import { describe, expect, it } from 'vitest';

const payload = {
  businessName: 'Urban Detailing',
  customerName: 'Jose',
  serviceName: 'Maintenance Shine',
  scheduledDate: '2026-08-21',
  startTime: '14:30',
};

describe('availability booking reminder email', () => {
  it('uses a clear customer subject', () => {
    expect(getAvailabilityBookingReminderSubject('Urban Detailing')).toBe(
      'Reminder: your appointment with Urban Detailing is coming up'
    );
  });

  it('keeps HTML copy short and includes visit details', () => {
    const html = buildAvailabilityBookingReminderHtml(payload);
    expect(html).toContain('Appointment reminder');
    expect(html).toContain(
      'Hi Jose, this is a reminder that your appointment with Urban Detailing is coming up.'
    );
    expect(html).toContain('Maintenance Shine');
    expect(html).toContain('2:30 PM');
  });

  it('matches plain text', () => {
    const text = buildAvailabilityBookingReminderPlainText(payload);
    expect(text).toContain('Appointment reminder');
    expect(text).toContain('Service: Maintenance Shine');
    expect(text).toContain('When:');
  });
});
