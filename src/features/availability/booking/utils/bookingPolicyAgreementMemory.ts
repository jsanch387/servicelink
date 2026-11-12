const STORAGE_KEY = 'servicelink.bookingPolicyAgreed.v1';

const agreedBusinessSlugs = new Set<string>();

function normalizedSlug(businessSlug: string): string {
  return businessSlug.trim();
}

function readStoredSlugs(): Set<string> {
  if (typeof sessionStorage === 'undefined') return new Set();
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY);
    if (!raw) return new Set();
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) return new Set();
    return new Set(parsed.filter(slug => typeof slug === 'string' && slug));
  } catch {
    return new Set();
  }
}

function writeStoredSlugs(slugs: Set<string>): void {
  if (typeof sessionStorage === 'undefined') return;
  try {
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify([...slugs]));
  } catch {
    // Private browsing can reject storage. The in-memory set still covers this load.
  }
}

export function hasAgreedToPublicBookingPolicy(businessSlug: string): boolean {
  const slug = normalizedSlug(businessSlug);
  if (!slug) return false;
  if (agreedBusinessSlugs.has(slug)) return true;
  if (!readStoredSlugs().has(slug)) return false;
  agreedBusinessSlugs.add(slug);
  return true;
}

export function markPublicBookingPolicyAgreed(businessSlug: string): void {
  const slug = normalizedSlug(businessSlug);
  if (!slug) return;
  agreedBusinessSlugs.add(slug);
  const stored = readStoredSlugs();
  stored.add(slug);
  writeStoredSlugs(stored);
}

export function clearPublicBookingPolicyAgreementMemory(): void {
  agreedBusinessSlugs.clear();
  if (typeof sessionStorage === 'undefined') return;
  try {
    sessionStorage.removeItem(STORAGE_KEY);
  } catch {
    // Ignore storage failures in tests and private browsing.
  }
}
