export function formatSaleDateRange(
  startsAt?: Date | string | null,
  endsAt?: Date | string | null
): string {
  if (!startsAt || !endsAt) {
    return 'No set dates — turn on when ready';
  }

  const formatDate = (date: Date) =>
    new Intl.DateTimeFormat('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    }).format(date);

  return `${formatDate(new Date(startsAt))} – ${formatDate(new Date(endsAt))}`;
}
