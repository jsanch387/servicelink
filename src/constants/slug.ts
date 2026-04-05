/**
 * Slug constants – shared between onboarding, edit profile, and API.
 * Keeps link slugs short and memorable; always stored lowercase in DB.
 */
export const SLUG_MAX_LENGTH = 40;

/** Live input sanitization (matches server-side slug cleaning). */
export function sanitizeSlugInput(value: string): string {
  const lower = value.toLowerCase();
  const withDashes = lower.replace(/[\s_]+/g, '-');
  const cleaned = withDashes.replace(/[^a-z0-9-]/g, '');
  const collapsed = cleaned.replace(/-+/g, '-');
  return collapsed.slice(0, SLUG_MAX_LENGTH);
}
