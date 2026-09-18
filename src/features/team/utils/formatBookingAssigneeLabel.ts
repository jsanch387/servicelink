import type { BookingAssigneeKind } from '../types/bookingAssignee';

/** Email on the picker; owner is labeled so they are not mixed up with a hire. */
export function formatBookingAssigneeLabel(
  email: string | null | undefined,
  kind: BookingAssigneeKind
): string {
  const trimmed = email?.trim() ?? '';
  if (kind === 'owner') {
    return trimmed ? `${trimmed} (owner)` : 'Owner';
  }
  if (kind === 'former') {
    return trimmed || 'Former teammate';
  }
  return trimmed || 'Team member';
}
