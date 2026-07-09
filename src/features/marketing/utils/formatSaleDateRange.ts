export function formatSaleDateRange(
  startsAt: Date | string,
  endsAt: Date | string
): string {
  const formatDate = (date: Date) =>
    new Intl.DateTimeFormat('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    }).format(date);

  return `${formatDate(new Date(startsAt))} – ${formatDate(new Date(endsAt))}`;
}
