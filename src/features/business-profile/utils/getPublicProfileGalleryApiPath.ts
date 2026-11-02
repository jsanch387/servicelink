/** Client fetch path for public gallery images (lazy tab load). */
export function getPublicProfileGalleryApiPath(slug: string): string {
  const trimmed = slug.trim();
  return `/api/public/profile/${encodeURIComponent(trimmed)}/gallery`;
}
