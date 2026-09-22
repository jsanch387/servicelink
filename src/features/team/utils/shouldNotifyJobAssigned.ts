export function shouldNotifyJobAssigned(p: {
  previousAssignedUserId: string | null;
  nextAssignedUserId: string | null;
  actorUserId: string;
}): boolean {
  const previous = p.previousAssignedUserId?.trim() || null;
  const next = p.nextAssignedUserId?.trim() || null;
  const actor = p.actorUserId.trim();
  if (!next || !actor) return false;
  if (next === previous) return false;
  if (next === actor) return false;
  return true;
}
