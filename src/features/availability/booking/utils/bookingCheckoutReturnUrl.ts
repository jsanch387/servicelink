/**
 * Builds `/[slug]/book` return URLs for Stripe Checkout (success / cancel).
 * Only whitelisted query keys from `resumeQuery` are forwarded (open-redirect safe).
 */

import { PUBLIC_BOOKING_FLOW_LANG_QUERY } from '@/constants/routes';

const WHITELIST = new Set([
  'serviceId',
  'addOnIds',
  'priceOptionId',
  'skipDetails',
  'detailsStep',
  'for',
  PUBLIC_BOOKING_FLOW_LANG_QUERY,
]);

const MAX_PARAM_VALUE_LEN = 500;

export function buildBookPageCheckoutReturnUrl(options: {
  baseUrl: string;
  businessSlug: string;
  checkout: 'cancel' | 'success';
  /** Raw query string (no leading `?`), e.g. from `URLSearchParams.toString()`. */
  resumeQuery?: string;
}): string {
  const base = options.baseUrl.replace(/\/$/, '');
  const slug = encodeURIComponent(options.businessSlug);
  const url = new URL(`${base}/${slug}/book`);
  url.searchParams.set('checkout', options.checkout);

  const raw = options.resumeQuery?.trim();
  if (raw) {
    const incoming = new URLSearchParams(raw);
    for (const [k, v] of incoming.entries()) {
      if (!WHITELIST.has(k)) continue;
      const safe = v.slice(0, MAX_PARAM_VALUE_LEN);
      if (safe) url.searchParams.set(k, safe);
    }
  }

  const built = url.toString();
  if (options.checkout === 'success') {
    // Stripe replaces `{CHECKOUT_SESSION_ID}` only when those characters appear
    // literally in the URL. URLSearchParams encodes `{` as `%7B`, which breaks it.
    const sep = built.includes('?') ? '&' : '?';
    return `${built}${sep}session_id={CHECKOUT_SESSION_ID}`;
  }

  return built;
}
