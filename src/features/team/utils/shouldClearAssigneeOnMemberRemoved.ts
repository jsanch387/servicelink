/** Upcoming confirmed jobs only. Past / completed / cancelled keep the name. */
export function shouldClearAssigneeOnMemberRemoved(p: {
  status: string;
  scheduledDate: string;
  asOf: string;
}): boolean {
  if (p.status.trim() !== 'confirmed') return false;
  const date = p.scheduledDate.trim();
  const asOf = p.asOf.trim();
  if (!date || !asOf) return false;
  return date >= asOf;
}
