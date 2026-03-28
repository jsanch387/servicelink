import type { CustomerLifecycle } from '@/features/customer-management/types';

export const CUSTOMER_STATUS_FILTERS: Array<{
  label: string;
  value: 'all' | CustomerLifecycle | 'needs_attention';
}> = [
  { label: 'All', value: 'all' },
  { label: 'New', value: 'new' },
  { label: 'Returning', value: 'returning' },
  { label: 'Due', value: 'needs_attention' },
];
