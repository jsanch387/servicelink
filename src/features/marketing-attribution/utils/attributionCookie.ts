import {
  MARKETING_UTM_COOKIE_MAX_AGE_SECONDS,
  MARKETING_UTM_COOKIE_NAME,
} from '../constants';
import type { MarketingUtmAttribution } from '../types';
import { normalizeStoredAttribution } from './firstTouchAttribution';

export function serializeMarketingAttributionCookie(
  attribution: MarketingUtmAttribution
): string {
  return JSON.stringify(attribution);
}

export function decodeMarketingAttributionCookie(
  raw: string | undefined | null
): MarketingUtmAttribution | null {
  if (!raw?.trim()) return null;

  try {
    let parsed: unknown;
    try {
      parsed = JSON.parse(raw);
    } catch {
      parsed = JSON.parse(decodeURIComponent(raw));
    }
    if (!parsed || typeof parsed !== 'object') return null;
    return normalizeStoredAttribution(parsed as MarketingUtmAttribution);
  } catch {
    return null;
  }
}

export function marketingAttributionCookieOptions(secure: boolean): {
  path: '/';
  maxAge: number;
  sameSite: 'lax';
  secure: boolean;
} {
  return {
    path: '/',
    maxAge: MARKETING_UTM_COOKIE_MAX_AGE_SECONDS,
    sameSite: 'lax',
    secure,
  };
}

function cookieIsSecure(): boolean {
  if (typeof window === 'undefined') {
    return process.env.NODE_ENV === 'production';
  }
  return window.location.protocol === 'https:';
}

export function readMarketingAttributionCookie(): MarketingUtmAttribution | null {
  if (typeof document === 'undefined') return null;

  const parts = document.cookie.split(';');
  for (const part of parts) {
    const trimmed = part.trim();
    if (!trimmed.startsWith(`${MARKETING_UTM_COOKIE_NAME}=`)) continue;
    const value = trimmed.slice(MARKETING_UTM_COOKIE_NAME.length + 1);
    return decodeMarketingAttributionCookie(value);
  }

  return null;
}

export function writeMarketingAttributionCookie(
  attribution: MarketingUtmAttribution
): void {
  if (typeof document === 'undefined') return;

  const options = marketingAttributionCookieOptions(cookieIsSecure());
  const secure = options.secure ? '; Secure' : '';
  document.cookie = [
    `${MARKETING_UTM_COOKIE_NAME}=${encodeURIComponent(serializeMarketingAttributionCookie(attribution))}`,
    `Path=${options.path}`,
    `Max-Age=${options.maxAge}`,
    `SameSite=${options.sameSite}`,
    secure,
  ]
    .filter(Boolean)
    .join('; ');
}

export function clearMarketingAttributionCookie(): void {
  if (typeof document === 'undefined') return;
  document.cookie = `${MARKETING_UTM_COOKIE_NAME}=; Path=/; Max-Age=0; SameSite=lax`;
}
