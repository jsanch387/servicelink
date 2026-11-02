import type {
  CustomerRecord,
  CustomerVisit,
} from '@/features/customer-management/types';
import { customerProfileHistoryRows } from '@/features/customer-management/utils/customerProfileHistory';
import { describe, expect, it } from 'vitest';

function customer(overrides: Partial<CustomerRecord> = {}): CustomerRecord {
  return {
    id: 'cust-1',
    name: 'Ada Lovelace',
    phone: '5125550100',
    email: 'ada@shop.com',
    lastService: 'Full detail',
    lastVisitDate: '2026-10-01',
    lastVisitDaysAgo: 30,
    nextAppointmentDate: null,
    nextAppointmentDaysUntil: null,
    totalVisits: 3,
    totalSpent: 300,
    maintenanceVisitsCompleted: 0,
    status: 'returning',
    note: '',
    ...overrides,
  };
}

function visit(
  id: string,
  serviceName: string,
  scheduledDate: string
): CustomerVisit {
  return { id, serviceName, scheduledDate, price: 40 };
}

describe('customerProfileHistoryRows', () => {
  it('keeps past visits when nothing is upcoming', () => {
    const rows = customerProfileHistoryRows(customer(), [
      visit('a', 'Full detail', '2026-10-01'),
      visit('b', 'Wash', '2026-08-01'),
    ]);
    expect(rows.map(row => row.serviceName)).toEqual(['Full detail', 'Wash']);
  });

  it('puts the upcoming appointment first and keeps the price with add-ons', () => {
    const rows = customerProfileHistoryRows(
      customer({
        nextAppointmentDate: '2026-11-12',
        nextAppointmentService: 'Ceramic coat — Sedan',
        nextAppointmentServicePrice: 200,
        nextAppointmentAddOnDetails: [{ name: 'Wax', price: 25 }],
      }),
      [
        visit('a', 'Full detail', '2026-10-01'),
        visit('b', 'Wash', '2026-08-01'),
        visit('c', 'Old wax', '2026-06-01'),
      ]
    );

    expect(rows.map(row => row.serviceName)).toEqual([
      'Ceramic coat',
      'Full detail',
      'Wash',
    ]);
    expect(rows[0]?.price).toBe(225);
    expect(rows[0]?.scheduledDate).toBe('2026-11-12');
  });

  it('shows only the upcoming appointment when there are no past visits', () => {
    const rows = customerProfileHistoryRows(
      customer({
        nextAppointmentDate: '2026-11-12',
        nextAppointmentService: 'Ceramic coat',
        nextAppointmentServicePrice: 200,
        totalVisits: 0,
        lastVisitDate: null,
        lastVisitDaysAgo: null,
      }),
      []
    );
    expect(rows).toHaveLength(1);
    expect(rows[0]?.serviceName).toBe('Ceramic coat');
  });
});
