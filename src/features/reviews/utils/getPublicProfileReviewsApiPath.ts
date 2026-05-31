/** Client fetch path for full public profile reviews (lazy tab load). */
export function getPublicProfileReviewsApiPath(slug: string): string {
  const trimmed = slug.trim();
  return `/api/public/profile/${encodeURIComponent(trimmed)}/reviews`;
}
