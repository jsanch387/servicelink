const agreedBusinessSlugs = new Set<string>();

function normalizedSlug(businessSlug: string): string {
  return businessSlug.trim();
}

export function hasAgreedToPublicBookingPolicy(businessSlug: string): boolean {
  const slug = normalizedSlug(businessSlug);
  return slug.length > 0 && agreedBusinessSlugs.has(slug);
}

export function markPublicBookingPolicyAgreed(businessSlug: string): void {
  const slug = normalizedSlug(businessSlug);
  if (!slug) return;
  agreedBusinessSlugs.add(slug);
}

export function clearPublicBookingPolicyAgreementMemory(): void {
  agreedBusinessSlugs.clear();
}
