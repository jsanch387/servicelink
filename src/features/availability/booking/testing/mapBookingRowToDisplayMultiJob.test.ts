import { describe, expect, it } from 'vitest';
import { mapBookingRowToDisplay } from '@/features/availability/booking/dashboard/utils/mapBookingRowToDisplay';

describe('mapBookingRowToDisplay — multi-job add-ons', () => {
  it('surfaces job_details add-ons when top-level addon_details is empty', () => {
    const display = mapBookingRowToDisplay({
      id: 'b1',
      business_id: 'biz',
      business_slug: 'acme',
      service_id: null,
      service_name: 'Signature Shinee — SUV + 1 more',
      service_price_cents: 379_00,
      addon_details: [],
      duration_minutes: 330,
      scheduled_date: '2026-07-27',
      start_time: '09:00:00',
      customer_name: 'Two Job',
      customer_email: 't@example.com',
      customer_phone: null,
      customer_street_address: null,
      customer_unit_apt: null,
      customer_city: null,
      customer_state: null,
      customer_zip: null,
      customer_vehicle_year: null,
      customer_vehicle_make: null,
      customer_vehicle_model: null,
      customer_notes: null,
      customer_id: null,
      status: 'confirmed',
      created_at: '2026-07-27T00:00:00Z',
      updated_at: '2026-07-27T00:00:00Z',
      discount_source: 'sale',
      discount_type: 'percentage',
      discount_value: 10,
      discount_label: 'Summer Sale — 10% off',
      discount_cents: 39_90,
      job_details: [
        {
          serviceId: null,
          serviceName: 'Signature Shinee',
          servicePriceOptionLabel: 'SUV',
          servicePriceCents: 210_00,
          selectedAddOns: [],
          durationMinutes: 150,
          vehicle: null,
        },
        {
          serviceId: null,
          serviceName: 'Signature Shinee',
          servicePriceOptionLabel: null,
          servicePriceCents: 169_00,
          selectedAddOns: [
            { id: 'a1', name: 'Pet hair removal', priceCents: 20_00 },
          ],
          durationMinutes: 180,
          vehicle: null,
        },
      ],
    });

    expect(display.addonDetails).toEqual([
      { id: 'a1', name: 'Pet hair removal', priceCents: 20_00 },
    ]);
    expect(display.servicePriceCents).toBe(379_00);
    expect(display.discount?.discountCents).toBe(39_90);
    expect(display.discount?.subtotalCents).toBe(399_00);
    expect(display.jobs).toHaveLength(2);
    expect(display.jobs[0]).toMatchObject({
      serviceName: 'Signature Shinee',
      servicePriceOptionLabel: 'SUV',
      servicePriceCents: 210_00,
      durationMinutes: 150,
    });
    expect(display.jobs[1]).toMatchObject({
      serviceName: 'Signature Shinee',
      servicePriceCents: 169_00,
      selectedAddOns: [
        { id: 'a1', name: 'Pet hair removal', priceCents: 20_00 },
      ],
    });
  });

  it('maps per-job vehicles onto display jobs', () => {
    const display = mapBookingRowToDisplay({
      id: 'b2',
      business_id: 'biz',
      business_slug: 'acme',
      booking_source: 'owner',
      service_id: null,
      service_name: 'Wash + 1 more',
      service_price_cents: 250_00,
      addon_details: [],
      duration_minutes: 120,
      scheduled_date: '2026-07-28',
      start_time: '10:00:00',
      customer_name: 'Two Cars',
      customer_email: null,
      customer_phone: '5551112222',
      customer_street_address: '1 Main',
      customer_unit_apt: null,
      customer_city: 'Austin',
      customer_state: 'TX',
      customer_zip: '78701',
      customer_vehicle_year: null,
      customer_vehicle_make: null,
      customer_vehicle_model: null,
      customer_notes: 'Gate code',
      customer_id: null,
      status: 'confirmed',
      created_at: '2026-07-28T00:00:00Z',
      updated_at: '2026-07-28T00:00:00Z',
      job_details: [
        {
          serviceId: null,
          serviceName: 'Exterior wash',
          servicePriceOptionLabel: null,
          servicePriceCents: 100_00,
          selectedAddOns: [],
          durationMinutes: 45,
          vehicle: { year: '2018', make: 'Toyota', model: 'Camry' },
        },
        {
          serviceId: null,
          serviceName: 'Interior clean',
          servicePriceOptionLabel: null,
          servicePriceCents: 150_00,
          selectedAddOns: [],
          durationMinutes: 75,
          vehicle: { year: '2021', make: 'Honda', model: 'CR-V' },
        },
      ],
    });

    expect(display.bookingSource).toBe('owner');
    expect(display.jobs.map(j => j.vehicleLabel)).toEqual([
      '2018 Toyota Camry',
      '2021 Honda CR-V',
    ]);
  });
});
