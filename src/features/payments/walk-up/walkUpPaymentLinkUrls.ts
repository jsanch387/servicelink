import { getPublicPaymentLinkPath, ROUTES } from '@/constants/routes';

export function buildWalkUpPaymentCompleteUrl(opts: {
  baseUrl: string;
}): string {
  const origin = opts.baseUrl.replace(/\/$/, '');
  return `${origin}${ROUTES.PAY_COMPLETE}?status=success`;
}

/** Shareable URL returned to mobile — never the raw Stripe Checkout URL. */
export function buildPublicPaymentLinkUrl(opts: {
  baseUrl: string;
  shortCode: string;
}): string {
  const origin = opts.baseUrl.replace(/\/$/, '');
  return `${origin}${getPublicPaymentLinkPath(opts.shortCode)}`;
}
