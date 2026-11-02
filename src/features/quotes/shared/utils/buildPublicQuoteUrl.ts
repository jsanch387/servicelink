import { getAppBaseUrl } from '@/libs/stripe/appBaseUrl';

/** Public `/q/` URL. Accepts the raw token or `quote_public_links.token_hash`. */
export function buildPublicQuoteUrl(
  tokenOrHash: string,
  origin?: string
): string {
  const token = tokenOrHash.trim();
  const base = (origin ?? getAppBaseUrl()).replace(/\/$/, '');
  return `${base}/q/${token}`;
}
