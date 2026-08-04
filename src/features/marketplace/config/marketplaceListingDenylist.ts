/**
 * Marketplace listing denylist (manual exclusions).
 *
 * Add login/account emails that should never appear in /find-detailers results
 * (test accounts, internal sandbox businesses, etc.).
 *
 * Matching is case-insensitive against the owner's Supabase Auth email.
 */
const MARKETPLACE_DENYLIST_EMAILS: readonly string[] = [
  'jesuss387@gmail.com',
  'urbanink.help@gmail.com',
  'app.servicelink@gmail.com',
  'josejsanch32@gmail.com',
];

function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

const DENYLIST_EMAIL_SET = new Set(
  MARKETPLACE_DENYLIST_EMAILS.map(normalizeEmail).filter(Boolean)
);

/** True when this business email is manually excluded from marketplace search. */
export function isMarketplaceListingDeniedByEmail(
  email: string | null | undefined
): boolean {
  if (DENYLIST_EMAIL_SET.size === 0) return false;
  const normalized = email?.trim() ? normalizeEmail(email) : '';
  if (!normalized) return false;
  return DENYLIST_EMAIL_SET.has(normalized);
}
