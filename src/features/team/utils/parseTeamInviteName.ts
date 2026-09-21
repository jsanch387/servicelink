import { TEAM_INVITE_NAME_MAX_LENGTH } from '../constants/teamInvite';

export type ParseTeamInviteNameResult =
  | { ok: true; name: string | null; provided: boolean }
  | { ok: false; error: string; status: 400 };

const NAME_ERROR = 'Enter their name.';

/** Trimmed owner-typed name, or null if omitted. Never derived from email. */
export function parseTeamInviteName(raw: unknown): ParseTeamInviteNameResult {
  if (raw === undefined || raw === null) {
    return { ok: true, name: null, provided: false };
  }
  if (typeof raw !== 'string') {
    return { ok: false, error: NAME_ERROR, status: 400 };
  }

  const name = raw.trim();
  if (!name || name.length > TEAM_INVITE_NAME_MAX_LENGTH) {
    return { ok: false, error: NAME_ERROR, status: 400 };
  }

  return { ok: true, name, provided: true };
}
