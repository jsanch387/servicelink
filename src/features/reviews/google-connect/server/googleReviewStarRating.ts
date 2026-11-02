const STAR_RATING_MAP: Record<string, number> = {
  ONE: 1,
  TWO: 2,
  THREE: 3,
  FOUR: 4,
  FIVE: 5,
};

export function mapGoogleStarRating(value: unknown): number | null {
  if (typeof value === 'number' && value >= 1 && value <= 5) {
    return Math.round(value);
  }
  if (typeof value !== 'string') return null;
  const mapped = STAR_RATING_MAP[value.trim().toUpperCase()];
  return mapped ?? null;
}
