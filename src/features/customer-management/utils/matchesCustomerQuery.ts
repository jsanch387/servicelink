import type { CustomerRecord } from '@/features/customer-management/types';

export function matchesCustomerQuery(
  customer: CustomerRecord,
  query: string
): boolean {
  const normalizedQuery = query.toLowerCase().trim();
  return customer.name.toLowerCase().includes(normalizedQuery);
}
