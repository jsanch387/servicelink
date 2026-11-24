import {
  customerListSchedule,
  formatCustomerListDate,
} from '@/features/customer-management/utils/customerListPresentation';
import { describe, expect, it } from 'vitest';

const now = new Date(2026, 9, 31);

describe('formatCustomerListDate', () => {
  it('omits the year when the date is in the current year', () => {
    expect(formatCustomerListDate('2026-03-18', now)).toBe('Mar 18');
  });

  it('includes the year when the date is in another year', () => {
    expect(formatCustomerListDate('2025-03-18', now)).toBe('Mar 18, 2025');
  });
});

function visitAgo(days: number): string | null {
  return customerListSchedule(
    {
      nextAppointmentDate: null,
      lastVisitDate: '2026-01-01',
      lastVisitDaysAgo: days,
    },
    now
  );
}

describe('customerListSchedule', () => {
  it('shows the next visit as one short line', () => {
    expect(
      customerListSchedule(
        {
          nextAppointmentDate: '2026-11-12',
          lastVisitDate: '2026-10-01',
          lastVisitDaysAgo: 30,
        },
        now
      )
    ).toBe('Nov 12');
  });

  it('includes the year when the next visit is not this year', () => {
    expect(
      customerListSchedule(
        {
          nextAppointmentDate: '2027-03-18',
          lastVisitDate: null,
          lastVisitDaysAgo: null,
        },
        now
      )
    ).toBe('Mar 18, 2027');
  });

  it('keeps a recent visit in days', () => {
    expect(visitAgo(0)).toBe('Today');
    expect(visitAgo(1)).toBe('Yesterday');
    expect(visitAgo(4)).toBe('4 days ago');
    expect(visitAgo(29)).toBe('29 days ago');
  });

  it('rounds older visits to months and years', () => {
    expect(visitAgo(30)).toBe('1 month ago');
    expect(visitAgo(90)).toBe('3 months ago');
    expect(visitAgo(364)).toBe('11 months ago');
    expect(visitAgo(365)).toBe('1 year ago');
    expect(visitAgo(730)).toBe('2 years ago');
  });

  it('returns null when there is no schedule', () => {
    expect(
      customerListSchedule(
        {
          nextAppointmentDate: null,
          lastVisitDate: null,
          lastVisitDaysAgo: null,
        },
        now
      )
    ).toBeNull();
  });
});
