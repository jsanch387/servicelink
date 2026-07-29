import { mapBookingRowToDisplay } from '@/features/availability/booking/dashboard/utils/mapBookingRowToDisplay';
import { computeBookingAmountDue } from '@/features/availability/booking/server/computeBookingAmountDue';
import { toBookingJobDetails } from '@/features/availability/booking/utils/ownerManualBookingJobs';
import {
  appointmentMoneyFieldsFromJobs,
  resolveBookingLineSubtotalCents,
} from '@/features/availability/booking/utils/resolveBookingLineSubtotalCents';
import { describe, expect, it } from 'vitest';

/**
 * Money QA — create denormalized fields, list remaining, and job_completed
 * amount-due must all agree with mobile Complete-sheet math.
 */
describe('appointment money QA (create → complete)', () => {
  const liveMultiJobDetails = [
    {
      serviceId: 'svc-1',
      serviceName: 'Signature Shinee',
      servicePriceOptionLabel: 'SUV',
      servicePriceCents: 210_00,
      selectedAddOns: [
        {
          id: 'a1',
          name: 'Pet hair removal',
          priceCents: 20_00,
          durationMinutes: 0,
        },
      ],
      durationMinutes: 180,
      vehicle: { year: '2016', make: 'Chevy', model: 'Impala' },
    },
    {
      serviceId: 'svc-1',
      serviceName: 'Signature Shinee',
      servicePriceOptionLabel: 'SUV',
      servicePriceCents: 200_00,
      selectedAddOns: [] as Array<{
        id: string;
        name: string;
        priceCents: number;
        durationMinutes?: number;
      }>,
      durationMinutes: 150,
      vehicle: { year: '2017', make: 'Toyota', model: 'Tacoma' },
    },
  ];

  it('create denormalized fields match job_details gross', () => {
    const money = appointmentMoneyFieldsFromJobs(liveMultiJobDetails);
    expect(money.servicePriceCents).toBe(410_00);
    expect(money.selectedAddOns).toHaveLength(1);
    expect(money.visitGrossCents).toBe(430_00);

    const storedJobs = toBookingJobDetails(
      liveMultiJobDetails.map(j => ({
        serviceName: j.serviceName,
        serviceId: j.serviceId,
        servicePriceOptionLabel: j.servicePriceOptionLabel,
        servicePriceCents: j.servicePriceCents,
        selectedAddOns: j.selectedAddOns.map(a => ({
          id: a.id,
          name: a.name,
          priceCents: a.priceCents,
        })),
        durationMinutes: j.durationMinutes,
        vehicle: j.vehicle,
      }))
    );
    const line = resolveBookingLineSubtotalCents({
      servicePriceCents: money.servicePriceCents,
      addonDetails: money.selectedAddOns,
      jobDetails: storedJobs,
    });
    expect(line.lineSubtotalCents).toBe(money.visitGrossCents);
    expect(line.fromJobs).toBe(true);
  });

  it('mobile Payment screen total ($390.10) clears amount due on complete', () => {
    // Matches live booking f27e0b39 + mobile screenshot:
    // $210 + $20 + $200 − frozen $39.90 sale = $390.10
    const result = computeBookingAmountDue({
      servicePriceCents: 210_00, // intentionally incomplete top-level
      addonDetails: { addons: [{ name: 'Pet hair', priceCents: 20_00 }] },
      jobDetails: liveMultiJobDetails,
      sessionFees: [],
      paidOnlineAmountCents: 0,
      sessionPayment: { method: 'cash', amountCents: 390_10 },
      discount: {
        discountSource: 'sale',
        discountType: 'percentage',
        discountValue: 10,
        discountCents: 39_90,
      },
    });

    expect(result.serviceCents).toBe(410_00);
    expect(result.addonCents).toBe(20_00);
    expect(result.discountCents).toBe(39_90);
    expect(result.adjustedTotalCents).toBe(390_10);
    expect(result.amountDueCents).toBe(0);
  });

  it('does not double-count add-ons when top-level and job_details both have them', () => {
    const result = computeBookingAmountDue({
      servicePriceCents: 410_00,
      addonDetails: [{ id: 'a1', name: 'Pet hair', priceCents: 20_00 }],
      jobDetails: liveMultiJobDetails,
      sessionFees: [],
      paidOnlineAmountCents: 0,
      sessionPayment: { method: 'cash', amountCents: 430_00 },
    });
    expect(result.addonCents).toBe(20_00);
    expect(result.adjustedTotalCents).toBe(430_00);
    expect(result.amountDueCents).toBe(0);
  });

  it('list remaining uses same math as complete (with session fees)', () => {
    const remaining = computeBookingAmountDue({
      servicePriceCents: 210_00,
      addonDetails: [],
      jobDetails: liveMultiJobDetails,
      sessionFees: [{ label: 'Tip', amountCents: 10_00 }],
      paidOnlineAmountCents: 0,
      sessionPayment: undefined,
      discount: {
        discountSource: 'sale',
        discountType: 'percentage',
        discountValue: 10,
        discountCents: 39_90,
      },
    });
    // 43000 - 3990 + 1000 fee = 40010
    expect(remaining.adjustedTotalCents).toBe(400_10);
    expect(remaining.amountDueCents).toBe(400_10);

    const afterPay = computeBookingAmountDue({
      servicePriceCents: 210_00,
      addonDetails: [],
      jobDetails: liveMultiJobDetails,
      sessionFees: [{ label: 'Tip', amountCents: 10_00 }],
      paidOnlineAmountCents: 0,
      sessionPayment: { method: 'cash', amountCents: 400_10 },
      discount: {
        discountSource: 'sale',
        discountType: 'percentage',
        discountValue: 10,
        discountCents: 39_90,
      },
    });
    expect(afterPay.amountDueCents).toBe(0);
  });

  it('single-job sale still works without job_details', () => {
    const result = computeBookingAmountDue({
      servicePriceCents: 100_00,
      addonDetails: [{ name: 'Odor', priceCents: 25_00 }],
      sessionFees: [],
      paidOnlineAmountCents: 0,
      sessionPayment: { method: 'cash', amountCents: 100_00 },
      discount: {
        discountSource: 'sale',
        discountType: 'percentage',
        discountValue: 20,
        discountCents: 25_00,
      },
    });
    // 12500 - 2500 = 10000
    expect(result.adjustedTotalCents).toBe(100_00);
    expect(result.amountDueCents).toBe(0);
  });

  it('deposit + session payment brings due to zero', () => {
    const result = computeBookingAmountDue({
      servicePriceCents: 210_00,
      addonDetails: [],
      jobDetails: liveMultiJobDetails,
      sessionFees: [],
      paidOnlineAmountCents: 100_00,
      sessionPayment: { method: 'cash', amountCents: 290_10 },
      discount: {
        discountSource: 'sale',
        discountType: 'percentage',
        discountValue: 10,
        discountCents: 39_90,
      },
    });
    expect(result.adjustedTotalCents).toBe(390_10);
    expect(result.amountDueCents).toBe(0);
  });

  it('mapBookingRowToDisplay surfaces full multi-job service + add-on totals', () => {
    const display = mapBookingRowToDisplay({
      id: 'b1',
      business_id: 'biz',
      business_slug: 'acme',
      service_id: null,
      service_name: 'Signature Shinee — SUV',
      service_price_cents: 210_00,
      addon_details: [],
      duration_minutes: 330,
      scheduled_date: '2026-07-27',
      start_time: '09:00:00',
      customer_name: 'Two Job',
      customer_email: null,
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
      subtotal_cents: 399_00,
      job_details: liveMultiJobDetails,
    });

    expect(display.servicePriceCents).toBe(410_00);
    expect(display.addonDetails).toEqual([
      {
        id: 'a1',
        name: 'Pet hair removal',
        priceCents: 20_00,
      },
    ]);
    expect(display.discount?.discountCents).toBe(39_90);
  });

  it('rejects overpay (negative amount due) like production mismatch', () => {
    const result = computeBookingAmountDue({
      servicePriceCents: 210_00,
      addonDetails: [],
      jobDetails: liveMultiJobDetails,
      sessionFees: [],
      paidOnlineAmountCents: 0,
      sessionPayment: { method: 'cash', amountCents: 430_00 },
      discount: {
        discountSource: 'sale',
        discountType: 'percentage',
        discountValue: 10,
        discountCents: 39_90,
      },
    });
    expect(result.adjustedTotalCents).toBe(390_10);
    expect(result.amountDueCents).toBeLessThan(0);
  });
});
