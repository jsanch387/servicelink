import type { BookingAssigneeKind } from '@/features/team/types/bookingAssignee';

function capitalizeToken(token: string): string {
  return token.charAt(0).toUpperCase() + token.slice(1).toLowerCase();
}

/** Card/calendar pill. Teammate names stay as typed; email is only a fallback. */
export function formatAssigneeBoardName(
  label: string,
  kind: BookingAssigneeKind
): string {
  const cleaned = label.replace(/\s*\(owner\)\s*$/i, '').trim();
  if (!cleaned) return kind === 'owner' ? 'Owner' : 'Assigned';

  if (!cleaned.includes('@')) {
    if (/^owner$/i.test(cleaned)) return 'Owner';
    if (/^team member$/i.test(cleaned)) return 'Team member';
    if (/^former teammate$/i.test(cleaned)) return 'Former teammate';
    return cleaned;
  }

  const local = cleaned.split('@')[0]?.trim() ?? '';
  const token = local.split(/[._+\s-]/).find(Boolean) ?? local;
  if (!token) return kind === 'owner' ? 'Owner' : 'Assigned';
  return capitalizeToken(token);
}
