import { describe, expect, it } from 'vitest';
import {
  buildAvailabilityBookingRequestDeniedHtml,
  buildAvailabilityBookingRequestDeniedPlainText,
  getAvailabilityBookingRequestDeniedSubject,
} from '../availability-booking-request-denied/availabilityBookingRequestDeniedTemplate';

const payload = {
  businessName: 'Urban Detailing',
  customerName: 'Jordan',
  serviceName: 'Full detail',
  scheduledDate: '2026-12-20',
  startTime: '09:00',
};

describe('appointment request denied email', () => {
  it('says the request was not confirmed', () => {
    expect(getAvailabilityBookingRequestDeniedSubject()).toBe(
      'Your appointment request was not confirmed'
    );
    const text = buildAvailabilityBookingRequestDeniedPlainText(payload);
    expect(text).toContain(
      'Hi Jordan, your appointment request with Urban Detailing was not confirmed'
    );
    expect(text).toContain('That time is no longer held.');
    expect(text).toContain('Full detail');
    expect(text).not.toContain('was canceled');
    expect(text).not.toContain('is confirmed');

    const html = buildAvailabilityBookingRequestDeniedHtml(payload);
    expect(html).toContain('Request not confirmed');
    expect(html).toContain('was not confirmed');
  });
});
