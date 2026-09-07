import {
  AUTH_REDIRECT_ATTRIBUTION_PARAM,
  MARKETING_UTM_COOKIE_NAME,
} from '../constants';
import type { MarketingUtmAttribution } from '../types';
import { decodeAttributionFromRedirect } from '../utils/authRedirectAttribution';
import {
  decodeMarketingAttributionCookie,
  marketingAttributionCookieOptions,
  serializeMarketingAttributionCookie,
} from '../utils/attributionCookie';
import { resolveFirstTouchAttribution } from '../utils/firstTouchAttribution';
import { parseMarketingUtmsFromSearchParams } from '../utils/utmCapture';
import type { NextRequest, NextResponse } from 'next/server';

function incomingFromRequest(request: NextRequest): MarketingUtmAttribution {
  const url = request.nextUrl;
  const fromUrl = parseMarketingUtmsFromSearchParams(
    url.searchParams,
    url.pathname
  );
  const fromRedirect = decodeAttributionFromRedirect(
    url.searchParams.get(AUTH_REDIRECT_ATTRIBUTION_PARAM)
  );
  const referer = request.headers.get('referer')?.trim();

  const incoming: MarketingUtmAttribution = {
    ...fromUrl,
    ...fromRedirect,
    landingPath: fromRedirect?.landingPath || fromUrl.landingPath,
    capturedAt: new Date().toISOString(),
  };

  if (!incoming.referrer && referer) {
    incoming.referrer = referer;
  }

  return incoming;
}

function setFirstTouchCookie(
  response: NextResponse,
  existing: MarketingUtmAttribution | null,
  incoming: MarketingUtmAttribution
): void {
  const next = resolveFirstTouchAttribution(existing, incoming);
  if (!next) return;

  response.cookies.set({
    name: MARKETING_UTM_COOKIE_NAME,
    value: serializeMarketingAttributionCookie(next),
    ...marketingAttributionCookieOptions(process.env.NODE_ENV === 'production'),
  });
}

/**
 * First-touch cookie on every HTML response. Set before JS so Instagram
 * in-app and OAuth redirects keep UTMs / fbclid.
 */
export function applyMarketingAttributionCookie(
  request: NextRequest,
  response: NextResponse
): void {
  if (request.method !== 'GET') return;

  const pathname = request.nextUrl.pathname;
  if (
    pathname.startsWith('/_next') ||
    pathname.startsWith('/api') ||
    pathname.includes('.')
  ) {
    return;
  }

  const existing = decodeMarketingAttributionCookie(
    request.cookies.get(MARKETING_UTM_COOKIE_NAME)?.value
  );
  setFirstTouchCookie(response, existing, incomingFromRequest(request));
}

/** Auth callback redirects replace the middleware response — re-apply first-touch. */
export function applyMarketingAttributionCookieFromUrl(
  request: Request,
  response: NextResponse
): NextResponse {
  const url = new URL(request.url);
  const cookieHeader = request.headers.get('cookie') ?? '';
  const match = cookieHeader.match(
    new RegExp(`(?:^|;\\s*)${MARKETING_UTM_COOKIE_NAME}=([^;]*)`)
  );
  const existing = decodeMarketingAttributionCookie(match?.[1] ?? null);
  const fromRedirect = decodeAttributionFromRedirect(
    url.searchParams.get(AUTH_REDIRECT_ATTRIBUTION_PARAM)
  );
  const fromUrl = parseMarketingUtmsFromSearchParams(
    url.searchParams,
    url.pathname
  );
  const incoming: MarketingUtmAttribution = {
    ...fromUrl,
    ...fromRedirect,
    landingPath: fromRedirect?.landingPath || fromUrl.landingPath,
    capturedAt: new Date().toISOString(),
  };

  setFirstTouchCookie(response, existing, incoming);
  return response;
}
