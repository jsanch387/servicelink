import type { DashboardQuoteStatus } from '../types';

const EDITABLE_STATUSES: DashboardQuoteStatus[] = [
  'requested',
  'draft',
  'sent',
  'viewed',
];

export function isDashboardQuoteEditableByOwner(
  status: DashboardQuoteStatus
): boolean {
  return EDITABLE_STATUSES.includes(status);
}
