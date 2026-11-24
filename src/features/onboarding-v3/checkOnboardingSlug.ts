import { API_ROUTES } from '@/constants/routes';
import { SLUG_MAX_LENGTH, sanitizeSlugInput } from '@/constants/slug';
import type { SlugPreviewResult } from '@/features/onboarding-preview/slugPreview';

function compactSlug(raw: string): string {
  return sanitizeSlugInput(raw).replace(/-/g, '').slice(0, SLUG_MAX_LENGTH);
}

function withSuffix(base: string, n: number): string {
  const suffix = String(n);
  return `${base.slice(0, SLUG_MAX_LENGTH - suffix.length)}${suffix}`;
}

async function isFree(slug: string): Promise<boolean | null> {
  try {
    const response = await fetch(
      `${API_ROUTES.BUSINESS_SLUG_CHECK}?slug=${encodeURIComponent(slug)}`
    );
    if (response.ok) return true;
    if (response.status === 409 || response.status === 400) return false;
    return null;
  } catch {
    return null;
  }
}

/** Live uniqueness check. A network failure leaves the slug as free so finish can recheck. */
export async function checkOnboardingSlug(
  raw: string
): Promise<SlugPreviewResult> {
  const slug = compactSlug(raw);
  if (slug.length < 3) return { state: 'idle' };

  const available = await isFree(slug);
  if (available === true || available === null) {
    return { state: 'free', slug };
  }

  for (let n = 2; n < 20; n += 1) {
    const suggestion = withSuffix(slug, n);
    const next = await isFree(suggestion);
    if (next === true || next === null) {
      return { state: 'taken', typed: slug, suggestion };
    }
  }

  return { state: 'taken', typed: slug, suggestion: withSuffix(slug, 2) };
}
