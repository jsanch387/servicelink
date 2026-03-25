import type { CustomerLifecycle } from '@/features/customer-management/types';

export const CUSTOMER_STATUS_FILTERS: Array<{
  label: string;
  value: 'all' | CustomerLifecycle;
}> = [
  { label: 'All', value: 'all' },
  { label: 'New', value: 'new' },
  { label: 'Returning', value: 'returning' },
];
