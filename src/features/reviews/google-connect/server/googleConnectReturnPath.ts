import { ROUTES } from '@/constants/routes';

export type GoogleConnectReturnNotice = 'connected' | 'error';

export const GOOGLE_REVIEWS_MOBILE_BRIDGE_PATH =
  '/mobile-bridge/google-reviews';

export function googleConnectReturnPath(
  notice: GoogleConnectReturnNotice
): string {
  const params = new URLSearchParams({ google: notice });
  return `${ROUTES.DASHBOARD.REVIEWS}?${params.toString()}`;
}

/** https page the OAuth browser can land on. It opens the app. */
export function googleReviewsMobileBridgePath(
  notice: GoogleConnectReturnNotice
): string {
  const params = new URLSearchParams({ google: notice });
  return `${GOOGLE_REVIEWS_MOBILE_BRIDGE_PATH}?${params.toString()}`;
}

/** App scheme opened by the bridge. Override with GOOGLE_MOBILE_REVIEWS_DEEP_LINK. */
export function googleReviewsMobileDeepLink(
  notice: GoogleConnectReturnNotice
): string {
  const base =
    process.env.GOOGLE_MOBILE_REVIEWS_DEEP_LINK?.trim() ||
    'servicelinkmobile://reviews/google';
  const url = new URL(base);
  url.searchParams.set('google', notice);
  return url.toString();
}
