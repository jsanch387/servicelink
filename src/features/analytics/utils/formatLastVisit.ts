/**
 * Human-readable relative time for the most recent link visit.
 */
export function formatLastVisit(occurredAt: string | null): string {
  if (!occurredAt) return 'Never';

  const date = new Date(occurredAt);
  if (Number.isNaN(date.getTime())) return 'Never';

  const now = Date.now();
  const diffMs = now - date.getTime();

  if (diffMs < 0) return 'Just now';

  const diffMins = Math.floor(diffMs / (1000 * 60));
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffDays = Math.floor(diffHours / 24);

  if (diffMins < 2) return 'Just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;

  return date.toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
    year:
      date.getFullYear() !== new Date().getFullYear() ? 'numeric' : undefined,
  });
}
