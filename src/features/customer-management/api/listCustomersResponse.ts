import type { CustomerRecord } from '@/features/customer-management/types';

export type ListCustomersSuccess = {
  success: true;
  customers: CustomerRecord[];
};

export function isListCustomersSuccess(
  data: unknown
): data is ListCustomersSuccess {
  return (
    typeof data === 'object' &&
    data !== null &&
    (data as ListCustomersSuccess).success === true &&
    Array.isArray((data as ListCustomersSuccess).customers)
  );
}
