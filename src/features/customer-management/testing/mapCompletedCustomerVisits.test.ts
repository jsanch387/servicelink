import {
  mapCompletedCustomerVisits,
  type CustomerVisitBookingRow,
} from '@/features/customer-management/server/mapCompletedCustomerVisits';
import { describe, expect, it } from 'vitest';

function row(
  overrides: Partial<CustomerVisitBookingRow> &
    Pick<CustomerVisitBookingRow, 'id' | 'scheduled_date'>
): CustomerVisitBookingRow {
  return {
    service_name: 'Detail',
    service_price_cents: 10000,
    addon_details: [],
    start_time: '09:00:00',
    status: 'completed',
    ...overrides,
  };
}

describe('mapCompletedCustomerVisits', () => {
  it('keeps the three newest completed visits and includes add-on price', () => {
    const visits = mapCompletedCustomerVisits([
      row({ id: 'a', scheduled_date: '2026-01-01' }),
      row({ id: 'b', scheduled_date: '2026-02-01' }),
      row({
        id: 'c',
        scheduled_date: '2026-03-01',
        service_price_cents: 15000,
        addon_details: [{ name: 'Odor', priceCents: 2500 }],
      }),
      row({ id: 'd', scheduled_date: '2026-04-01', service_name: '  ' }),
      row({
        id: 'cancelled',
        scheduled_date: '2026-05-01',
        status: 'cancelled',
      }),
      row({
        id: 'upcoming',
        scheduled_date: '2026-06-01',
        status: 'confirmed',
      }),
    ]);

    expect(visits.map(visit => visit.id)).toEqual(['d', 'c', 'b']);
    expect(visits[0]?.serviceName).toBe('Visit');
    expect(visits[1]?.price).toBe(175);
  });

  it('drops the pricing option and counts extra services', () => {
    const visits = mapCompletedCustomerVisits([
      row({
        id: 'option',
        scheduled_date: '2026-04-02',
        service_name: 'Full Interior Detail — Large SUV',
      }),
      row({
        id: 'multi',
        scheduled_date: '2026-04-03',
        service_name: 'Signature Shinee — SUV + 1 more',
        job_details: [
          {
            serviceName: 'Signature Shinee',
            servicePriceOptionLabel: 'SUV',
            servicePriceCents: 10000,
            durationMinutes: 60,
            selectedAddOns: [],
          },
          {
            serviceName: 'Ceramic Coating',
            servicePriceOptionLabel: null,
            servicePriceCents: 8000,
            durationMinutes: 45,
            selectedAddOns: [],
          },
        ],
      }),
    ]);

    expect(visits.map(visit => visit.serviceName)).toEqual([
      'Signature Shinee + 1 more',
      'Full Interior Detail',
    ]);
  });

  it('orders a later start time on the same day first', () => {
    const visits = mapCompletedCustomerVisits([
      row({
        id: 'morning',
        scheduled_date: '2026-04-01',
        start_time: '08:00:00',
      }),
      row({
        id: 'afternoon',
        scheduled_date: '2026-04-01',
        start_time: '15:00:00',
      }),
    ]);

    expect(visits.map(visit => visit.id)).toEqual(['afternoon', 'morning']);
  });
});
