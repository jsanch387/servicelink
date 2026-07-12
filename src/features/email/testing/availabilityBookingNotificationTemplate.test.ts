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
  it('includes tightened mobile stacked detail-row spacing in layout CSS', () => {
    const html = buildAvailabilityBookingEmailHtml(basePayload(), {
      audience: 'customer',
      businessName: 'Acme Detail',
    });
    expect(html).toContain('.email-detail-row .email-detail-label');
    expect(html).toContain('padding-bottom: 0 !important');
    expect(html).toContain('margin-top: 2px !important');
    expect(html).toContain('padding-bottom: 10px !important');
    expect(html).toContain(
      '.email-section-card > .email-detail-row:last-child .email-detail-value'
    );
  });

  it('uses ServiceLink dark brand layout', () => {
    const html = buildAvailabilityBookingEmailHtml(basePayload(), {
      audience: 'customer',
      businessName: 'Acme Detail',
    });
    expect(html).toContain('background-color:#0a0a0a');
    expect(html).toContain('background-color:#151515');
    expect(html).toContain('ServiceLink');
    expect(html).not.toContain('background-color:#f4f7f9');
  });

  it('shows sale discount line and discounted appointment total', () => {
    const html = buildAvailabilityBookingEmailHtml(
      {
        ...basePayload(),
        discount: {
          label: 'Summer Sale — 35% off',
          discountCents: 52_50,
          estimatedTotalCents: 97_50,
        },
      },
      { audience: 'customer', businessName: 'Acme Detail' }
    );
    expect(html).toContain('Summer Sale — 35% off');
    expect(html).toContain('-$52.50');
    expect(html).toContain('$97.50');
    expect(html).toContain('Appointment total');
    expect(html).toContain('email-discount-line');
  });

  it('owner email also includes sale discount in service details', () => {
    const html = buildAvailabilityBookingEmailHtml(
      {
        ...basePayload(),
        discount: {
          label: 'Summer Sale — 35% off',
          discountCents: 52_50,
          estimatedTotalCents: 97_50,
        },
      },
      {
        audience: 'owner',
        dashboardBookingsUrl: 'https://example.com/bookings',
      }
    );
    expect(html).toContain('Summer Sale — 35% off');
    expect(html).toContain('-$52.50');
    expect(html).toContain('email-discount-line');
  });

  it('includes appointment total inside Service details (no separate Price details section)', () => {
    const html = buildAvailabilityBookingEmailHtml(basePayload(), {
      audience: 'customer',
      businessName: 'Acme Detail',
    });
    expect(html).toContain('Service details');
    expect(html).toContain('Appointment total');
    expect(html).not.toContain('Price details');
  });

  it('pay in person omits confusing ServiceLink charge copy', () => {
    const html = buildAvailabilityBookingEmailHtml(
      {
        ...basePayload(),
        paymentSummary: {
          title: 'Payment',
          rows: [{ label: 'Payment method', value: 'Pay in person' }],
        },
      },
      { audience: 'customer', businessName: 'Acme Detail' }
    );
    expect(html).toContain('Pay in person');
    expect(html).not.toContain('ServiceLink card charge');
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

describe('buildAvailabilityBookingEmailHtml — service location', () => {
  it('owner mobile: shows customer service address', () => {
    const html = buildAvailabilityBookingEmailHtml(
      {
        ...basePayload(),
        serviceLocation: {
          type: 'mobile',
          formattedAddress: '123 Main St, Austin, TX 78701',
        },
      },
      {
        audience: 'owner',
        dashboardBookingsUrl: 'https://app.example.com/dashboard/bookings',
      }
    );
    expect(html).toContain('Service address');
    expect(html).toContain('123 Main St, Austin, TX 78701');
    expect(html).not.toContain('Shop visit');
  });

  it('owner shop: shows shop visit and shop address', () => {
    const html = buildAvailabilityBookingEmailHtml(
      {
        ...basePayload(),
        serviceLocation: {
          type: 'shop',
          formattedAddress: '456 Garage Ln, Austin, TX 78702',
        },
      },
      {
        audience: 'owner',
        dashboardBookingsUrl: 'https://app.example.com/dashboard/bookings',
      }
    );
    expect(html).toContain('Shop visit');
    expect(html).toContain('456 Garage Ln, Austin, TX 78702');
  });

  it('customer shop: shows visit us at shop address', () => {
    const html = buildAvailabilityBookingEmailHtml(
      {
        ...basePayload(),
        serviceLocation: {
          type: 'shop',
          formattedAddress: '456 Garage Ln, Austin, TX 78702',
        },
      },
      { audience: 'customer', businessName: 'Acme Detail' }
    );
    expect(html).toContain('Visit us at');
    expect(html).toContain('Shop address');
    expect(html).toContain('456 Garage Ln, Austin, TX 78702');
  });

  it('customer mobile: shows their service address', () => {
    const html = buildAvailabilityBookingEmailHtml(
      {
        ...basePayload(),
        serviceLocation: {
          type: 'mobile',
          formattedAddress: '123 Main St, Austin, TX 78701',
        },
      },
      { audience: 'customer', businessName: 'Acme Detail' }
    );
    expect(html).toContain('Service address');
    expect(html).toContain('123 Main St, Austin, TX 78701');
  });

  it('renders section titles above cards (not inside)', () => {
    const html = buildAvailabilityBookingEmailHtml(basePayload(), {
      audience: 'customer',
      businessName: 'Acme Detail',
    });
    expect(html).toContain('Your information');
    expect(html).not.toContain('text-transform:uppercase');
    expect(html).toContain('class="email-section"');
  });

  it('wraps long service and add-on names in price details', () => {
    const longService =
      'Premium ceramic coating package with paint correction and multi-stage polish';
    const longAddOn =
      'Interior deep clean with pet hair removal and ozone odor treatment';
    const html = buildAvailabilityBookingEmailHtml(
      {
        ...basePayload(),
        serviceName: longService,
        selectedAddOns: [{ id: 'a1', name: longAddOn, priceCents: 50_00 }],
      },
      { audience: 'customer', businessName: 'Acme Detail' }
    );
    expect(html).toContain(longService);
    expect(html).toContain(longAddOn);
    expect(html).toContain('email-price-label');
    expect(html).toContain('email-price-amount');
    expect(html).toContain('&bull;');
  });

  it('spaces every section evenly including service address', () => {
    const html = buildAvailabilityBookingEmailHtml(
      {
        ...basePayload(),
        serviceLocation: {
          type: 'mobile',
          formattedAddress: '123 Main St, Austin, TX 78701',
        },
      },
      { audience: 'customer', businessName: 'Acme Detail' }
    );
    const sectionCount = (html.match(/class="email-section"/g) ?? []).length;
    const marginMatches = html.match(/margin-top:24px/g) ?? [];
    expect(sectionCount).toBeGreaterThan(3);
    expect(marginMatches.length).toBe(sectionCount - 1);
  });
});
