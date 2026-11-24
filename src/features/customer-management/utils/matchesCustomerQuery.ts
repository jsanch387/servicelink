import type { CustomerRecord } from '@/features/customer-management/types';

function digitsOnly(value: string): string {
  return value.replace(/\D/g, '');
}

/** Name match, or a phone match on digits so punctuation does not matter. */
export function matchesCustomerQuery(
  customer: CustomerRecord,
  query: string
): boolean {
  const normalizedQuery = query.toLowerCase().trim();
  if (customer.name.toLowerCase().includes(normalizedQuery)) return true;

  const queryDigits = digitsOnly(normalizedQuery);
  if (!queryDigits) return false;
  return digitsOnly(customer.phone).includes(queryDigits);
}
