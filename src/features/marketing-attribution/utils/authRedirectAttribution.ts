import { AUTH_REDIRECT_ATTRIBUTION_PARAM } from '../constants';
import type { MarketingUtmAttribution } from '../types';
import { normalizeStoredAttribution } from './firstTouchAttribution';

const MAX_REDIRECT_ATTR_CHARS = 1500;

function toBase64Url(value: string): string {
  if (typeof Buffer !== 'undefined') {
    return Buffer.from(value, 'utf8')
      .toString('base64')
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=+$/g, '');
  }
  return btoa(value)
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/g, '');
}

function fromBase64Url(value: string): string {
  const padded = value.replace(/-/g, '+').replace(/_/g, '/');
  const pad =
    padded.length % 4 === 0 ? '' : '='.repeat(4 - (padded.length % 4));
  if (typeof Buffer !== 'undefined') {
    return Buffer.from(padded + pad, 'base64').toString('utf8');
  }
  return atob(padded + pad);
}

/** Compact first-touch payload for OAuth / magic-link `redirectTo`. */
export function encodeAttributionForRedirect(
  attribution: MarketingUtmAttribution
): string | null {
  const normalized = normalizeStoredAttribution(attribution);
  if (!normalized) return null;

  const compact: MarketingUtmAttribution = { ...normalized };
  delete compact.capturedAt;

  const encoded = toBase64Url(JSON.stringify(compact));
  if (encoded.length > MAX_REDIRECT_ATTR_CHARS) return null;
  return encoded;
}

export function decodeAttributionFromRedirect(
  raw: string | undefined | null
): MarketingUtmAttribution | null {
  if (!raw?.trim()) return null;

  try {
    const parsed = JSON.parse(
      fromBase64Url(raw.trim())
    ) as MarketingUtmAttribution;
    if (!parsed || typeof parsed !== 'object') return null;
    return normalizeStoredAttribution(parsed);
  } catch {
    return null;
  }
}

/** Append first-touch to an auth redirect URL (Google / Apple / email confirm). */
export function appendAttributionToAuthRedirect(
  redirectUrl: string,
  attribution?: MarketingUtmAttribution | null
): string {
  if (!attribution) return redirectUrl;

  const encoded = encodeAttributionForRedirect(attribution);
  if (!encoded) return redirectUrl;

  try {
    const url = new URL(redirectUrl);
    url.searchParams.set(AUTH_REDIRECT_ATTRIBUTION_PARAM, encoded);
    return url.toString();
  } catch {
    const joiner = redirectUrl.includes('?') ? '&' : '?';
    return `${redirectUrl}${joiner}${AUTH_REDIRECT_ATTRIBUTION_PARAM}=${encodeURIComponent(encoded)}`;
  }
}
