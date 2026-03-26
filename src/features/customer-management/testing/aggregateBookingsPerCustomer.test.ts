import {
  aggregateBookingsPerCustomer,
  type BookingRowForCustomerMetrics,
} from '@/features/customer-management/server/aggregateBookingsPerCustomer';
import { afterEach, describe, expect, it, vi } from 'vitest';

function bookingFixture(
  overrides: Partial<BookingRowForCustomerMetrics>
): BookingRowForCustomerMetrics {
  return {
    customer_id: 'cust_1',
    service_name: 'Base Wash',
    service_price_cents: 10000,
    addon_details: [],
    scheduled_date: '2026-03-20',
    start_time: '09:00:00',
    status: 'completed',
    created_at: '2026-03-20T00:00:00.000Z',
    ...overrides,
  };
}

describe('[Core] booking aggregation per customer', () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  it('builds visits, spend, last visit, and next appointment correctly', () => {
    // Freeze time so "upcoming confirmed" logic is deterministic.
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-03-25T10:00:00.000Z'));

    const rows: BookingRowForCustomerMetrics[] = [
      bookingFixture({
        scheduled_date: '2026-03-10',
        start_time: '08:00:00',
        status: 'completed',
        service_name: 'Basic Detail',
        service_price_cents: 10000,
      }),
      bookingFixture({
        scheduled_date: '2026-03-20',
        start_time: '10:30:00',
        status: 'completed',
        service_name: 'Black Label Detail',
        service_price_cents: 15000,
        addon_details: [{ name: 'Odor Removal', priceCents: 2500 }],
      }),
      // Future confirmed bookings: earliest should be selected as "next".
      bookingFixture({
        scheduled_date: '2026-03-26',
        start_time: '12:00:00',
        status: 'confirmed',
        service_name: 'Interior Refresh',
        service_price_cents: 12000,
        addon_details: [{ name: 'Pet Hair', priceCents: 1500 }],
      }),
      bookingFixture({
        scheduled_date: '2026-03-28',
        start_time: '09:00:00',
        status: 'confirmed',
        service_name: 'Full Detail',
        service_price_cents: 22000,
      }),
      // Cancelled and missing-customer rows should be ignored by aggregation.
      bookingFixture({
        status: 'cancelled',
        scheduled_date: '2026-03-30',
      }),
      bookingFixture({
        customer_id: '   ',
        status: 'completed',
      }),
    ];

    const metrics = aggregateBookingsPerCustomer(rows).get('cust_1');
    expect(metrics).toBeDefined();

    expect(metrics?.totalVisits).toBe(2);
    // 10,000 + (15,000 + 2,500)
    expect(metrics?.totalSpentCents).toBe(27500);
    expect(metrics?.lifecycle).toBe('returning');

    expect(metrics?.lastVisitScheduledDate).toBe('2026-03-20');
    expect(metrics?.lastVisitServiceName).toBe('Black Label Detail');
    expect(metrics?.lastVisitAddonNames).toEqual(['Odor Removal']);

    expect(metrics?.nextAppointmentScheduledDate).toBe('2026-03-26');
    expect(metrics?.nextAppointmentServiceName).toBe('Interior Refresh');
    expect(metrics?.nextAppointmentAddonNames).toEqual(['Pet Hair']);
  });
});
