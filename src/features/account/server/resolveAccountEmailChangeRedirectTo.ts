import { ROUTES } from '@/constants/routes';
import { getAppBaseUrl } from '@/libs/stripe/appBaseUrl';
import type { NextRequest } from 'next/server';

/** Flat query flag on `/auth/callback` → Settings banner. */
export const EMAIL_CHANGE_NOTICE_PARAM = 'email_notice';
export const EMAIL_CHANGE_NOTICE_UPDATED = 'updated';
export const EMAIL_CHANGE_NOTICE_ERROR = 'error';

/**
 * Origins allowed as the base for email-change confirmation redirects.
 * Prevents open redirects while still supporting local `npm run dev`.
 */
export function getAllowedEmailChangeOrigins(request: NextRequest): string[] {
  const origins = new Set<string>();

  const fromRequest = getAppBaseUrl(request).replace(/\/$/, '');
  if (fromRequest) origins.add(fromRequest);

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL?.trim().replace(/\/$/, '');
  if (siteUrl) origins.add(siteUrl);

  // Always allow common local Next ports (needed when Site URL is production).
  origins.add('http://localhost:3000');
  origins.add('http://127.0.0.1:3000');

  return [...origins];
}

/**
 * Build `emailRedirectTo` for Supabase `updateUser({ email })`.
 *
 * Uses flat callback query params (`next` + `email_notice`) — nested
 * `?email_updated=1` inside `next` often gets dropped by Supabase verify.
 */
export function resolveAccountEmailChangeRedirectTo(
  request: NextRequest,
  clientOrigin?: string | null
): string {
  const allowed = getAllowedEmailChangeOrigins(request);
  const normalizedClient = (clientOrigin ?? '').trim().replace(/\/$/, '');

  const baseUrl =
    (normalizedClient &&
      allowed.some(o => o === normalizedClient) &&
      normalizedClient) ||
    allowed[0] ||
    'http://localhost:3000';

  const callback = new URL(`${baseUrl}${ROUTES.AUTH.CALLBACK}`);
  callback.searchParams.set('next', ROUTES.DASHBOARD.SETTINGS);
  callback.searchParams.set(
    EMAIL_CHANGE_NOTICE_PARAM,
    EMAIL_CHANGE_NOTICE_UPDATED
  );
  return callback.toString();
}

/** Settings URL with a success or error banner query. */
export function buildSettingsEmailNoticeUrl(
  requestUrl: string,
  notice: typeof EMAIL_CHANGE_NOTICE_UPDATED | typeof EMAIL_CHANGE_NOTICE_ERROR
): URL {
  const target = new URL(ROUTES.DASHBOARD.SETTINGS, requestUrl);
  target.searchParams.set(EMAIL_CHANGE_NOTICE_PARAM, notice);
  return target;
}
