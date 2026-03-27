import type { CustomerRecord } from '@/features/customer-management/types';

export const NEEDS_ATTENTION_DAYS = 90;

export function isCustomerNeedsAttention(customer: CustomerRecord): boolean {
  return (
    !customer.nextAppointmentDate &&
    typeof customer.lastVisitDaysAgo === 'number' &&
    customer.lastVisitDaysAgo > NEEDS_ATTENTION_DAYS
  );
}
