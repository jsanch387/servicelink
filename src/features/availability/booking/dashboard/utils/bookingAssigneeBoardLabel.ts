import type { BookingAssigneeOption } from '@/features/team/types/bookingAssignee';
import { shopShowsAssigneeLabels } from '@/features/team/utils/shopHasBookingAssignees';
import { formatAssigneeBoardName } from './formatAssigneeBoardName';

/** Null when the shop has never had teammates — hide assignee chrome. */
export function bookingAssigneeBoardLabel(
  assignedUserId: string | null | undefined,
  options: readonly BookingAssigneeOption[]
): string | null {
  if (!shopShowsAssigneeLabels(options)) return null;
  const id = assignedUserId?.trim() ?? '';
  if (!id) return null;
  const option = options.find(item => item.userId === id);
  if (!option) return 'Assigned';
  return formatAssigneeBoardName(option.label, option.kind);
}

export function calendarAssigneeLabel(
  label: string | null | undefined
): string | null {
  const trimmed = label?.trim() ?? '';
  if (!trimmed || trimmed === 'Unassigned') return null;
  return trimmed;
}
