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
  });
});
