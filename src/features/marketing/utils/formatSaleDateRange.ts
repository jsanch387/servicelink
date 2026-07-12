import { formatMarketingCalendarDate } from './marketingCalendarDate';

export function formatSaleDateRange(
  startsAt?: Date | string | null,
  endsAt?: Date | string | null
): string {
  if (!startsAt || !endsAt) {
    return 'No set dates — turn on when ready';
  }

  return `${formatMarketingCalendarDate(startsAt)} – ${formatMarketingCalendarDate(endsAt)}`;
}
