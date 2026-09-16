export type ParseAssignedUserIdResult =
  | { ok: true; assignedUserId: string | null }
  | { ok: false; error: string };

/** Body field for PATCH assignee. Empty string or null = unassigned. */
export function parseAssignedUserId(
  raw: unknown
): ParseAssignedUserIdResult {
  if (raw === null) {
    return { ok: true, assignedUserId: null };
  }
  if (typeof raw !== 'string') {
    return { ok: false, error: 'assignedUserId must be a user id or null.' };
  }
  const trimmed = raw.trim();
  return { ok: true, assignedUserId: trimmed.length === 0 ? null : trimmed };
}
