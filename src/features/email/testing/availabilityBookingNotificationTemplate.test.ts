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
  it('keeps detail rows label-left / value-right on mobile (no stack)', () => {
    const html = buildAvailabilityBookingEmailHtml(basePayload(), {
      audience: 'customer',
      businessName: 'Acme Detail',
    });
    expect(html).toContain('email-detail-label');
    expect(html).toContain('email-detail-value');
    expect(html).not.toContain(
      '.email-detail-row .email-detail-label,\n    .email-detail-row .email-detail-value'
    );
    expect(html).not.toContain('text-align: left !important');
  });

  it('uses dark brand layout without ServiceLink header mark', () => {
    const html = buildAvailabilityBookingEmailHtml(basePayload(), {
      audience: 'customer',
      businessName: 'Acme Detail',
    });
    expect(html).toContain('background-color:#0a0a0a');
    expect(html).toContain('background-color:#151515');
    expect(html).not.toContain('>ServiceLink</span>');
    expect(html).toContain('ServiceLink'); // footer copyright
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

  it('includes notes when provided and omits the section when empty', () => {
    const withNotes = buildAvailabilityBookingEmailHtml(
      {
        ...basePayload(),
        customerNotes: 'Please use the side gate.\nPark in back.',
      },
      { audience: 'customer', businessName: 'Acme Detail' }
    );
    expect(withNotes).toContain('Notes');
    expect(withNotes).toContain('Please use the side gate.');
    expect(withNotes).toContain('<br />Park in back.');

    const withoutNotes = buildAvailabilityBookingEmailHtml(basePayload(), {
      audience: 'customer',
      businessName: 'Acme Detail',
    });
    expect(withoutNotes).not.toContain('>Notes<');
  });

  it('omits email and vehicle rows when not provided', () => {
    const html = buildAvailabilityBookingEmailHtml(
      {
        ...basePayload(),
        customerEmail: '',
        customerPhone: undefined,
        customerVehicleYear: undefined,
        customerVehicleMake: undefined,
        customerVehicleModel: undefined,
      },
      {
        audience: 'owner',
        dashboardBookingsUrl: 'https://example.com/bookings',
      }
    );
    expect(html).toContain('Name');
    expect(html).not.toContain('>Email<');
    expect(html).not.toContain('>Vehicle<');
    expect(html).not.toContain('>Phone<');
  });

  it('shows $0.00 service price for custom jobs priced at zero', () => {
    const html = buildAvailabilityBookingEmailHtml(
      {
        ...basePayload(),
        servicePriceCents: 0,
        totalPriceCents: 0,
        selectedAddOns: [],
      },
      { audience: 'customer', businessName: 'Acme Detail' }
    );
    expect(html).toContain('$0.00');
  });

  it('owner-created copy differs from customer-booked copy', () => {
    const ownerCreated = buildAvailabilityBookingEmailHtml(
      { ...basePayload(), createdByOwner: true },
      {
        audience: 'owner',
        dashboardBookingsUrl: 'https://app.example.com/dashboard/bookings',
      }
    );
    expect(ownerCreated).toContain('Appointment created');
    expect(ownerCreated).toContain('You scheduled this appointment for Jane');
    expect(ownerCreated).toContain('created from your dashboard');

    const customerBooked = buildAvailabilityBookingEmailHtml(basePayload(), {
      audience: 'owner',
      dashboardBookingsUrl: 'https://app.example.com/dashboard/bookings',
    });
    expect(customerBooked).toContain('New appointment');
    expect(customerBooked).toContain('You have a new appointment');
    expect(customerBooked).toContain(
      'someone booked an appointment with your business'
    );
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
    expect(html).toContain('Your appointment');
    expect(html).not.toContain('Your information');
    expect(html).not.toContain('text-transform:uppercase');
    expect(html).toContain('class="email-section"');
  });

  it('owner email includes customer card; customer email does not', () => {
    const ownerHtml = buildAvailabilityBookingEmailHtml(basePayload(), {
      audience: 'owner',
      dashboardBookingsUrl: 'https://example.com/bookings',
    });
    const customerHtml = buildAvailabilityBookingEmailHtml(basePayload(), {
      audience: 'customer',
      businessName: 'Acme Detail',
    });
    expect(ownerHtml).toContain('Customer info');
    expect(ownerHtml).toContain('jane@example.com');
    expect(customerHtml).not.toContain('Your information');
    expect(customerHtml).not.toContain('>Customer<');
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

  it('multi-job email shows receipt-style jobs and appointment sale total', () => {
    const payload = {
      customerName: 'Two Job',
      customerEmail: 'test@example.com',
      customerPhone: '5125551234',
      serviceName: '2 jobs',
      scheduledDate: '2026-07-27',
      startTime: '09:00',
      durationMinutes: 330,
      totalPriceCents: 399_00,
      discount: {
        label: 'Summer Sale — 10% off',
        discountCents: 39_90,
        estimatedTotalCents: 359_10,
      },
      createdByOwner: true,
      serviceLocation: {
        type: 'mobile' as const,
        formattedAddress: '123 Main St, Austin, TX 78701',
      },
      jobs: [
        {
          serviceName: 'Signature Shinee',
          servicePriceOptionLabel: 'SUV',
          servicePriceCents: 210_00,
          durationMinutes: 150,
          customerVehicleYear: '2016',
          customerVehicleMake: 'Chevy',
          customerVehicleModel: 'Cruze',
          totalPriceCents: 210_00,
        },
        {
          serviceName: 'Signature Shinee',
          servicePriceOptionLabel: 'SUV',
          servicePriceCents: 169_00,
          selectedAddOns: [
            { id: 'a1', name: 'Pet hair removal', priceCents: 20_00 },
          ],
          durationMinutes: 180,
          customerVehicleYear: '2017',
          customerVehicleMake: 'Toyota',
          customerVehicleModel: 'Tacoma',
          totalPriceCents: 189_00,
        },
      ],
    };

    const customerHtml = buildAvailabilityBookingEmailHtml(payload, {
      audience: 'customer',
      businessName: 'Acme Detail',
    });
    expect(customerHtml).toContain('When &amp; where');
    expect(customerHtml).toContain('Jobs');
    expect(customerHtml).toContain('Pricing');
    expect(customerHtml).not.toContain('Your information');
    expect(customerHtml).not.toContain('Job 1');
    expect(customerHtml).toContain('$210.00');
    expect(customerHtml).toContain('$169.00');
    expect(customerHtml).toContain('$20.00');
    expect(customerHtml).not.toContain('$189.00');
    expect(customerHtml).toContain('2016 Chevy Cruze');
    expect(customerHtml).toContain('Summer Sale — 10% off');
    expect(customerHtml).toContain('-$39.90');
    expect(customerHtml).toContain('$359.10');
    expect(customerHtml).toContain('Subtotal');
    expect(customerHtml).toContain('Total');
    expect(customerHtml).toContain('Acme Detail · 2 jobs');

    const ownerHtml = buildAvailabilityBookingEmailHtml(payload, {
      audience: 'owner',
      dashboardBookingsUrl: 'https://example.com/bookings',
    });
    expect(ownerHtml).toContain('Customer');
    expect(ownerHtml).toContain('test@example.com');
    expect(ownerHtml).toContain('(512) 555-1234');
    expect(ownerHtml).toContain('When &amp; where');
    expect(ownerHtml).toContain('2 jobs');
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
    expect(sectionCount).toBeGreaterThanOrEqual(3);
    expect(marginMatches.length).toBe(sectionCount - 1);
  });
});
