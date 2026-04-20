import { buildAvailabilityBookingEmailHtml } from '@/features/email/availability-booking-notification/availabilityBookingNotificationTemplate';
import type { AvailabilityBookingNotificationPayload } from '@/features/email/availability-booking-notification/types';
import { describe, expect, it } from 'vitest';

function basePayload(): AvailabilityBookingNotificationPayload {
  return {
    customerName: 'Jane',
    customerEmail: 'jane@example.com',
    serviceName: 'Full detail',
    scheduledDate: '2026-06-15',
    startTime: '09:00',
    durationMinutes: 120,
    servicePriceCents: 100_00,
    servicePriceOptionLabel: 'SUV',
    selectedAddOns: [{ id: 'a1', name: 'Pet hair removal', priceCents: 50_00 }],
    totalPriceCents: 150_00,
  };
}

describe('buildAvailabilityBookingEmailHtml — booking + payments', () => {
  it('includes Price details with appointment total and no duplicate “Estimated total” block', () => {
    const html = buildAvailabilityBookingEmailHtml(basePayload(), {
      audience: 'customer',
      businessName: 'Acme Detail',
    });
    expect(html).toContain('Price details');
    expect(html).toContain('Appointment total');
    expect(html).not.toContain('Estimated Total');
    expect(html).not.toContain('Estimated Cost Breakdown');
  });

  it('customer email: Stripe payment footnote names the business (not generic “your provider”)', () => {
    const html = buildAvailabilityBookingEmailHtml(
      {
        ...basePayload(),
        paymentSummary: {
          title: 'Payment',
          rows: [{ label: 'Paid in full', value: '$150.00' }],
          stripeCardPayment: true,
        },
      },
      { audience: 'customer', businessName: 'Acme Detail' }
    );
    expect(html).toContain('Acme Detail');
    expect(html).toContain('not charged twice');
    expect(html).not.toContain('paid to your provider');
  });

  it('owner email: Stripe footnote speaks to the provider (no “pay your provider” copy)', () => {
    const html = buildAvailabilityBookingEmailHtml(
      {
        ...basePayload(),
        paymentSummary: {
          title: 'Payment',
          rows: [{ label: 'Deposit paid', value: '$50.00' }],
          stripeCardPayment: true,
        },
      },
      {
        audience: 'owner',
        dashboardBookingsUrl: 'https://app.example.com/dashboard/bookings',
      }
    );
    expect(html).toContain(
      'Collect any remaining balance according to your agreement with the customer'
    );
    expect(html).not.toContain('Any remaining balance is paid to');
  });

  it('escapes HTML in payment row values', () => {
    const html = buildAvailabilityBookingEmailHtml(
      {
        ...basePayload(),
        paymentSummary: {
          rows: [{ label: 'Status', value: '<script>x</script>' }],
        },
      },
      { audience: 'customer', businessName: 'Acme' }
    );
    expect(html).not.toContain('<script>');
    expect(html).toContain('&lt;script&gt;');
  });
});
