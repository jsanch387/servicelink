import type { PublicProfileRatingBreakdownRow } from '../types/publicProfile';

/** Percent per star (5 → 1) from visible review rows. */
export function computeRatingBreakdown(
  ratings: number[]
): PublicProfileRatingBreakdownRow[] {
  const counts = [0, 0, 0, 0, 0];
  for (const rating of ratings) {
    const star = Math.round(rating);
    if (star >= 1 && star <= 5) {
      counts[star - 1] += 1;
    }
  }
  const total = ratings.length;
  return [5, 4, 3, 2, 1].map(stars => ({
    stars,
    percent: total > 0 ? Math.round((counts[stars - 1] / total) * 100) : 0,
  }));
}
