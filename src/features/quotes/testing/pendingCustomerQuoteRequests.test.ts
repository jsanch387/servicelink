import { describe, expect, it } from 'vitest';
import {
  countPendingCustomerQuoteRequests,
  isPendingCustomerQuoteRequest,
  listPendingCustomerQuoteRequestsNewestFirst,
} from '@/features/quotes/dashboard/utils/pendingCustomerQuoteRequests';
import type { DashboardQuote } from '@/features/quotes/dashboard/types';

function q(partial: Partial<DashboardQuote>): DashboardQuote {
  return {
    id: partial.id ?? '1',
    status: partial.status ?? 'requested',
    source: partial.source ?? 'customer_requested',
    customerName: partial.customerName ?? 'A',
    customerEmail: partial.customerEmail ?? 'a@b.co',
    customerPhone: partial.customerPhone ?? null,
    serviceName: partial.serviceName ?? 'S',
    totalCents: partial.totalCents ?? 0,
    durationMinutes: partial.durationMinutes ?? 60,
    activityAt: partial.activityAt ?? '2026-01-01T00:00:00Z',
    createdAt: partial.createdAt ?? '2026-01-01T00:00:00Z',
    scheduledDate: partial.scheduledDate ?? null,
    scheduledTime: partial.scheduledTime ?? null,
    note: partial.note ?? null,
    requestMessage: partial.requestMessage ?? null,
    vehicleLine: partial.vehicleLine ?? null,
    vehicleYear: partial.vehicleYear ?? null,
    vehicleMake: partial.vehicleMake ?? null,
    vehicleModel: partial.vehicleModel ?? null,
    serviceStreet: partial.serviceStreet ?? null,
    serviceUnit: partial.serviceUnit ?? null,
    serviceCity: partial.serviceCity ?? null,
    serviceState: partial.serviceState ?? null,
    serviceZip: partial.serviceZip ?? null,
    serviceAddressLine: partial.serviceAddressLine ?? null,
    serviceId: partial.serviceId ?? null,
    servicePriceCents: partial.servicePriceCents ?? null,
    addonDetails: partial.addonDetails ?? null,
    publicToken: partial.publicToken ?? '',
  };
}

describe('pendingCustomerQuoteRequests', () => {
  it('isPendingCustomerQuoteRequest is true only for customer_requested + requested', () => {
    expect(
      isPendingCustomerQuoteRequest(
        q({ source: 'customer_requested', status: 'requested' })
      )
    ).toBe(true);
    expect(
      isPendingCustomerQuoteRequest(
        q({ source: 'customer_requested', status: 'draft' })
      )
    ).toBe(false);
    expect(
      isPendingCustomerQuoteRequest(
        q({ source: 'owner_created', status: 'requested' })
      )
    ).toBe(false);
  });

  it('countPendingCustomerQuoteRequests', () => {
    expect(
      countPendingCustomerQuoteRequests([
        q({ id: 'a', source: 'customer_requested', status: 'requested' }),
        q({ id: 'b', source: 'owner_created', status: 'draft' }),
        q({ id: 'c', source: 'customer_requested', status: 'requested' }),
      ])
    ).toBe(2);
  });

  it('listPendingCustomerQuoteRequestsNewestFirst sorts by createdAt desc', () => {
    const rows = listPendingCustomerQuoteRequestsNewestFirst([
      q({
        id: 'old',
        createdAt: '2026-01-01T00:00:00Z',
        source: 'customer_requested',
        status: 'requested',
      }),
      q({
        id: 'new',
        createdAt: '2026-06-01T00:00:00Z',
        source: 'customer_requested',
        status: 'requested',
      }),
    ]);
    expect(rows.map(r => r.id)).toEqual(['new', 'old']);
  });
});
