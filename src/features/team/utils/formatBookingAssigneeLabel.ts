import type { BookingAssigneeKind } from '../types/bookingAssignee';

/** Picker label. Teammates prefer the invite name; owner stays email. */
export function formatBookingAssigneeLabel(p: {
  name?: string | null;
  email?: string | null;
  kind: BookingAssigneeKind;
}): string {
  const name = p.name?.trim() ?? '';
  const email = p.email?.trim() ?? '';
  if (p.kind === 'owner') {
    return email ? `${email} (owner)` : 'Owner';
  }
  if (name) return name;
  if (p.kind === 'former') return email || 'Former teammate';
  return email || 'Team member';
}
