import { describe, expect, it } from 'vitest';
import {
  buildAvailabilityBookingRequestReceivedHtml,
  buildAvailabilityBookingRequestReceivedPlainText,
  getAvailabilityBookingRequestReceivedSubject,
} from '../availability-booking-request-received/availabilityBookingRequestReceivedTemplate';

const payload = {
  businessName: 'Urban Detailing',
  customerName: 'Jordan',
  serviceName: 'Full detail',
  scheduledDate: '2026-12-20',
  startTime: '09:00',
};

describe('appointment request received email', () => {
  it('says the request was received and is not confirmed yet', () => {
    expect(getAvailabilityBookingRequestReceivedSubject()).toBe(
      'We received your appointment request'
    );
    const text = buildAvailabilityBookingRequestReceivedPlainText(payload);
    expect(text).toContain(
      "Hi Jordan, we received your appointment request. We'll take a look, and we'll let you know once it's confirmed."
    );
    expect(text).not.toContain('with Urban Detailing');
    expect(text).not.toContain('approves it');
    expect(text).toContain('Full detail');

    const html = buildAvailabilityBookingRequestReceivedHtml(payload);
    expect(html).toContain('Request received');
    expect(html).toContain('take a look');
    expect(html).toContain('let you know once it&#039;s confirmed');
    expect(html).not.toContain('approves it');
  });
});
