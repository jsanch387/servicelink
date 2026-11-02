import type { BookingAssigneeOption } from '../types/bookingAssignee';

/** Assignee picker is only useful when the shop has at least one hire. */
export function shopHasBookingAssignees(
  options: readonly BookingAssigneeOption[]
): boolean {
  return options.some(option => option.kind === 'member');
}

/** Past jobs can still show a removed worker’s name. */
export function shopShowsAssigneeLabels(
  options: readonly BookingAssigneeOption[]
): boolean {
  return options.some(
    option => option.kind === 'member' || option.kind === 'former'
  );
}
