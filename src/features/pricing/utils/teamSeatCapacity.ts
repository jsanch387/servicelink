/**
 * Owner counts as a seat. Active hires and pending invites fill the rest.
 * A resend of an invite that is already pending does not take another seat.
 */
export function teamInviteWouldExceedSeatLimit(input: {
  activeMemberCount: number;
  pendingInviteCount: number;
  seatLimit: number;
  resendingPendingInvite: boolean;
}): boolean {
  if (input.resendingPendingInvite) return false;
  const seatsUsed = 1 + input.activeMemberCount + input.pendingInviteCount;
  return seatsUsed >= input.seatLimit;
}
