import type { Sale, SaleStatus } from '../types';
import { compareMarketingCalendarDayToWindow } from './marketingCalendarDate';

/**
 * Dashboard badge status. Date windows use UTC calendar days (same as storage),
 * not wall-clock instant compare — otherwise US timezones show "Scheduled" on
 * the start calendar day the owner picked.
 */
export function getSaleStatus(sale: Sale, now: Date = new Date()): SaleStatus {
  if (!sale.isActive) return 'inactive';

  if (!sale.startsAt || !sale.endsAt) {
    return 'active';
  }

  const position = compareMarketingCalendarDayToWindow(
    now,
    sale.startsAt,
    sale.endsAt
  );
  if (position === 'before') return 'scheduled';
  if (position === 'after') return 'expired';
  return 'active';
}
