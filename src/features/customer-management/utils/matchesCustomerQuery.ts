import type { CustomerRecord } from '@/features/customer-management/types';

export function matchesCustomerQuery(
  customer: CustomerRecord,
  query: string
): boolean {
  const searchable = [
    customer.name,
    customer.email,
    customer.phone,
    customer.lastService,
    ...(customer.lastBookingAddOns ?? []),
    customer.note,
  ]
    .join(' ')
    .toLowerCase();
  return searchable.includes(query.toLowerCase().trim());
}
