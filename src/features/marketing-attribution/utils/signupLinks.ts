import { ROUTES } from '@/constants/routes';

export type MarketingSignupUtmInput = {
  source: string;
  medium: string;
  campaign: string;
  content?: string;
};

/** Build `/signup?utm_…` for marketing CTAs (blog, pricing, homepage, etc.). */
export function buildMarketingSignupPath(
  input: MarketingSignupUtmInput
): string {
  const params = new URLSearchParams();
  params.set('utm_source', input.source);
  params.set('utm_medium', input.medium);
  params.set('utm_campaign', input.campaign);
  if (input.content?.trim()) {
    params.set('utm_content', input.content.trim());
  }
  return `${ROUTES.AUTH.SIGNUP}?${params.toString()}`;
}

/** In-article / bottom CTA on a resource guide. */
export function blogGuideSignupPath(slug: string): string {
  return buildMarketingSignupPath({
    source: 'blog',
    medium: 'cta',
    campaign: slug,
  });
}

/** Resources index page CTA. */
export function blogIndexSignupPath(): string {
  return buildMarketingSignupPath({
    source: 'blog',
    medium: 'cta',
    campaign: 'resources-index',
  });
}

/** Marketing site page CTAs (homepage, pricing, features, …). */
export function siteSignupPath(
  campaign: 'homepage' | 'pricing' | 'features' | 'marketplace'
): string {
  return buildMarketingSignupPath({
    source: 'site',
    medium: 'cta',
    campaign,
  });
}
