/** Client fetch path for public membership plans (lazy tab load). */
export function getPublicProfileMembershipsApiPath(slug: string): string {
  const trimmed = slug.trim();
  return `/api/public/profile/${encodeURIComponent(trimmed)}/memberships`;
}
