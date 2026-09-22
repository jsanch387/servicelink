export type TeamInviteNameRow = {
  email?: string | null;
  name?: string | null;
  accepted_user_id?: string | null;
};

/** Owner-typed invite name for a teammate. Null when the row has none. */
export function teamInviteDisplayName(
  invites: ReadonlyArray<TeamInviteNameRow>,
  lookup: { userId?: string | null; email?: string | null }
): string | null {
  const userId = lookup.userId?.trim() ?? '';
  const email = lookup.email?.trim().toLowerCase() ?? '';
  const match =
    (userId
      ? invites.find(row => row.accepted_user_id?.trim() === userId)
      : undefined) ??
    (email
      ? invites.find(row => row.email?.trim().toLowerCase() === email)
      : undefined);
  const name = match?.name?.trim() ?? '';
  return name || null;
}

export function teamMemberHeading(member: {
  name?: string | null;
  email: string;
}): string {
  return member.name?.trim() || member.email;
}
