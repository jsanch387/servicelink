import type {
  CustomerLifecycle,
  CustomerRecord,
} from '@/features/customer-management/types';

export const NEEDS_ATTENTION_DAYS = 90;

/** Due: last completed visit was more than 90 days ago, and nothing is booked. */
export function isCustomerNeedsAttention(customer: CustomerRecord): boolean {
  return (
    !customer.nextAppointmentDate &&
    typeof customer.lastVisitDaysAgo === 'number' &&
    customer.lastVisitDaysAgo > NEEDS_ATTENTION_DAYS
  );
}

/**
 * New is 0–1 completed visits. Returning is 2 or more.
 * Due wins over both: a customer who is due only matches the Due filter.
 */
export function customerMatchesStatusFilter(
  customer: CustomerRecord,
  statusFilter: 'all' | CustomerLifecycle | 'needs_attention'
): boolean {
  const due = isCustomerNeedsAttention(customer);
  if (statusFilter === 'all') return true;
  if (statusFilter === 'needs_attention') return due;
  if (due) return false;
  return customer.status === statusFilter;
}
