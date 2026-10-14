import {
  buildAvailabilityBookingRescheduledHtml,
  buildAvailabilityBookingRescheduledPlainText,
  getAvailabilityBookingRescheduledSubject,
} from '@/features/email/availability-booking-rescheduled/availabilityBookingRescheduledTemplate';
import { describe, expect, it } from 'vitest';

const payload = {
  businessName: 'Urban Detailing',
  customerName: 'Jose',
  serviceName: 'Maintenance Shine',
  scheduledDate: '2026-08-20',
  startTime: '14:30',
  previousScheduledDate: '2026-08-18',
  previousStartTime: '09:00',
};

describe('availability booking rescheduled email', () => {
  it('uses a clear customer subject', () => {
    expect(getAvailabilityBookingRescheduledSubject('Urban Detailing')).toBe(
      'Your appointment with Urban Detailing was rescheduled'
    );
  });

  it('includes the new time and the previous time', () => {
    const html = buildAvailabilityBookingRescheduledHtml(payload);
    expect(html).toContain('Appointment rescheduled');
    expect(html).toContain(
      'Hi Jose, your appointment with Urban Detailing has been rescheduled.'
    );
    expect(html).toContain('Maintenance Shine');
    expect(html).toContain('2:30 PM');
    expect(html).toContain('9:00 AM');
    expect(html).toContain('Sent for Urban Detailing via ServiceLink');
  });

  it('matches plain text', () => {
    const text = buildAvailabilityBookingRescheduledPlainText(payload);
    expect(text).toContain('Appointment rescheduled');
    expect(text).toContain('Hi Jose, your appointment with Urban Detailing');
    expect(text).toContain('Service: Maintenance Shine');
    expect(text).toContain('New time:');
    expect(text).toContain('Previously:');
  });
});
