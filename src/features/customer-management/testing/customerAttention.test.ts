import type { CustomerRecord } from '@/features/customer-management/types';
import {
  customerMatchesStatusFilter,
  isCustomerNeedsAttention,
} from '@/features/customer-management/utils/customerAttention';
import { describe, expect, it } from 'vitest';

function customerFixture(overrides?: Partial<CustomerRecord>): CustomerRecord {
  return {
    id: 'cust_1',
    name: 'Shane Dawson',
    phone: '(555) 111-2222',
    email: 'shane@example.com',
    lastService: 'Black Label Detail',
    lastVisitDate: '2026-01-01',
    lastVisitDaysAgo: 100,
    nextAppointmentDate: null,
    nextAppointmentDaysUntil: null,
    totalVisits: 2,
    totalSpent: 700,
    maintenanceVisitsCompleted: 0,
    status: 'returning',
    note: '',
    ...overrides,
  };
}

describe('[Core] needs attention flag', () => {
  it('is true when no upcoming appointment and last visit is > 90 days ago', () => {
    expect(isCustomerNeedsAttention(customerFixture())).toBe(true);
  });

  it('is false when customer has an upcoming appointment', () => {
    expect(
      isCustomerNeedsAttention(
        customerFixture({ nextAppointmentDate: '2026-04-20' })
      )
    ).toBe(false);
  });

  it('is false when last visit is recent or unknown', () => {
    expect(
      isCustomerNeedsAttention(customerFixture({ lastVisitDaysAgo: 45 }))
    ).toBe(false);
    expect(
      isCustomerNeedsAttention(customerFixture({ lastVisitDaysAgo: null }))
    ).toBe(false);
  });
});

describe('customer status filters', () => {
  it('keeps a recent first visit under New', () => {
    const customer = customerFixture({
      status: 'new',
      totalVisits: 1,
      lastVisitDaysAgo: 10,
    });

    expect(customerMatchesStatusFilter(customer, 'new')).toBe(true);
    expect(customerMatchesStatusFilter(customer, 'needs_attention')).toBe(
      false
    );
  });

  it('puts a first visit older than 90 days under Due only', () => {
    const customer = customerFixture({
      status: 'new',
      totalVisits: 1,
      lastVisitDaysAgo: 120,
      nextAppointmentDate: null,
    });

    expect(customerMatchesStatusFilter(customer, 'new')).toBe(false);
    expect(customerMatchesStatusFilter(customer, 'needs_attention')).toBe(true);
    expect(customerMatchesStatusFilter(customer, 'all')).toBe(true);
  });
});
