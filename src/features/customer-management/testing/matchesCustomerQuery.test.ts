import type { CustomerRecord } from '@/features/customer-management/types';
import { matchesCustomerQuery } from '@/features/customer-management/utils/matchesCustomerQuery';
import { describe, expect, it } from 'vitest';

function customerFixture(overrides?: Partial<CustomerRecord>): CustomerRecord {
  return {
    id: 'cust_1',
    name: 'Jane Doe',
    phone: '(555) 111-2222',
    email: 'jane@example.com',
    lastService: 'Black Label Detail',
    lastVisitDate: null,
    lastVisitDaysAgo: null,
    nextAppointmentDate: null,
    nextAppointmentDaysUntil: null,
    totalVisits: 0,
    totalSpent: 0,
    maintenanceVisitsCompleted: 0,
    status: 'new',
    note: '',
    ...overrides,
  };
}

describe('[Core] customer search matching', () => {
  it('matches only by customer name (case-insensitive)', () => {
    // Core behavior: search input filters by name only.
    const customer = customerFixture({ name: 'Maria Rodriguez' });
    expect(matchesCustomerQuery(customer, 'maria')).toBe(true);
    expect(matchesCustomerQuery(customer, 'RODRIGUEZ')).toBe(true);
  });

  it('does not match by non-name fields (email/phone/service/note)', () => {
    // Guardrail: keep search scope aligned with what is shown in the UI list.
    const customer = customerFixture({
      name: 'Maria Rodriguez',
      email: 'owner+vip@example.com',
      phone: '(555) 333-4444',
      lastService: 'Premium Wash',
      note: 'Loves early appointments',
    });

    expect(matchesCustomerQuery(customer, 'vip@example.com')).toBe(false);
    expect(matchesCustomerQuery(customer, '333-4444')).toBe(false);
    expect(matchesCustomerQuery(customer, 'Premium Wash')).toBe(false);
    expect(matchesCustomerQuery(customer, 'early appointments')).toBe(false);
  });
});
