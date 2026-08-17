import {
  buildAvailabilityBookingCanceledHtml,
  buildAvailabilityBookingCanceledPlainText,
  getAvailabilityBookingCanceledSubject,
} from '@/features/email/availability-booking-canceled/availabilityBookingCanceledTemplate';
import { describe, expect, it } from 'vitest';

const payload = {
  businessName: 'Urban Detailing',
  customerName: 'Jose',
  serviceName: 'Maintenance Shine',
  scheduledDate: '2026-08-20',
  startTime: '14:30',
};

describe('availability booking canceled email', () => {
  it('uses a clear customer subject', () => {
    expect(getAvailabilityBookingCanceledSubject('Urban Detailing')).toBe(
      'Your appointment with Urban Detailing was canceled'
    );
  });

  it('keeps HTML copy short and includes visit details', () => {
    const html = buildAvailabilityBookingCanceledHtml(payload);
    expect(html).toContain('Appointment canceled');
    expect(html).toContain(
      'Hi Jose, your appointment with Urban Detailing has been canceled.'
    );
    expect(html).toContain('Maintenance Shine');
    expect(html).toContain('2:30 PM');
    expect(html).toContain('Sent for Urban Detailing via ServiceLink');
  });

  it('matches plain text', () => {
    const text = buildAvailabilityBookingCanceledPlainText(payload);
    expect(text).toContain('Appointment canceled');
    expect(text).toContain('Hi Jose, your appointment with Urban Detailing');
    expect(text).toContain('Service: Maintenance Shine');
  });
});
