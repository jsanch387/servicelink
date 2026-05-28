export function formatAverageRating(rating: number): string {
  if (!Number.isFinite(rating)) return '0';
  return rating % 1 === 0 ? String(Math.round(rating)) : rating.toFixed(1);
}

export function formatReviewDate(iso: string, locale: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return '';
  return date.toLocaleDateString(locale, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}
