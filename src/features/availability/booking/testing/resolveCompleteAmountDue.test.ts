import { describe, expect, it } from 'vitest';
import { resolveCompleteAmountDueCents } from '@/features/availability/booking/dashboard/utils/resolveCompleteAmountDue';
import type { AvailabilityBookingDisplay } from '@/features/availability/booking/dashboard/types';

function base(
  override: Partial<AvailabilityBookingDisplay> = {}
): AvailabilityBookingDisplay {
  return {
    id: 'b1',
    customerName: 'A',
    customerPhone: '',
    customerEmail: '',
    serviceName: 'Wash',
    serviceDurationMinutes: 60,
    servicePriceCents: 100_00,
    addonDetails: [],
    jobs: [],
    date: '2026-07-29',
    time: '9:00 AM',
    startTimeHHmm: '09:00',
    status: 'confirmed',
    address: { street: '', city: '', state: '', zip: '' },
    notes: '',
    createdAt: '2026-07-29T00:00:00Z',
    ...override,
  };
}

describe('resolveCompleteAmountDueCents', () => {
  it('uses payment remaining when present', () => {
    expect(
      resolveCompleteAmountDueCents(
        base({
          payment: {
            paymentStatus: 'awaiting_payment',
            paymentMethodSelected: 'none',
            currency: 'usd',
            totalAmountCents: 150_00,
            paidOnlineAmountCents: 50_00,
            remainingAmountCents: 100_00,
          },
        })
      )
    ).toBe(100_00);
  });

  it('sums jobs minus discount when payment is missing', () => {
    expect(
      resolveCompleteAmountDueCents(
        base({
          servicePriceCents: 0,
          jobs: [
            {
              serviceName: 'A',
              servicePriceOptionLabel: null,
              servicePriceCents: 100_00,
              durationMinutes: 60,
              selectedAddOns: [{ id: 'a1', name: 'Add', priceCents: 20_00 }],
              vehicleLabel: null,
            },
            {
              serviceName: 'B',
              servicePriceOptionLabel: null,
              servicePriceCents: 80_00,
              durationMinutes: 60,
              selectedAddOns: [],
              vehicleLabel: null,
            },
          ],
          discount: {
            source: 'sale',
            label: 'Sale',
            discountCents: 20_00,
            subtotalCents: 200_00,
          },
        })
      )
    ).toBe(180_00);
  });
});
