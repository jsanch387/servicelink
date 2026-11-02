/** Client fetch path for one page of public profile reviews. */
export function getPublicProfileReviewsApiPath(
  slug: string,
  offset = 0
): string {
  const trimmed = slug.trim();
  const path = `/api/public/profile/${encodeURIComponent(trimmed)}/reviews`;
  if (!Number.isInteger(offset) || offset <= 0) return path;
  return `${path}?offset=${offset}`;
}
