import type { CustomerLifecycle } from '@/features/customer-management/types';

/** Mobile list only: colored text, no badge box (detail panel + desktop use CustomerStatusBadge). */
export function mobileListStatusStyle(status: CustomerLifecycle): {
  label: string;
  className: string;
} {
  if (status === 'returning') {
    return { label: 'Returning', className: 'text-emerald-400 font-medium' };
  }
  return { label: 'New', className: 'text-sky-400 font-medium' };
}
