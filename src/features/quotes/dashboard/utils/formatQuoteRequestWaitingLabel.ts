const DAY_MS = 24 * 60 * 60 * 1000;

/** Age of an unanswered customer request, for list + detail. */
export function formatQuoteRequestWaitingLabel(
  requestedAtIso: string,
  now: Date = new Date()
): string {
  const then = new Date(requestedAtIso);
  if (Number.isNaN(then.getTime())) return '';
  const days = Math.floor((now.getTime() - then.getTime()) / DAY_MS);
  if (days < 1) return 'Requested today';
  if (days === 1) return 'Waiting 1 day';
  return `Waiting ${days} days`;
}
