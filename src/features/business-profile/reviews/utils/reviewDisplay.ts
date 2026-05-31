/** Round to one decimal for averages (e.g. 4.46 → 4.5). */
export function roundAverageRating(rating: number): number {
  if (!Number.isFinite(rating)) return 0;
  return Math.round(rating * 10) / 10;
}

/** Profile display: always one decimal — `5.0`, `4.5`, not `5`. */
export function formatAverageRating(rating: number): string {
  return roundAverageRating(rating).toFixed(1);
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
