/**
 * Resend client and app URL helpers.
 * Shared by all email sending in this feature.
 */

import { Resend } from 'resend';

const resendApiKey = process.env.RESEND_API_KEY;

export function getResendClient(): Resend | null {
  if (!resendApiKey) return null;
  return new Resend(resendApiKey);
}

/**
 * Base URL for the app (used for links in emails).
 * Set SITE_URL or APP_URL in Vercel (Production + Preview) to https://myservicelink.app
 * so email links use your domain instead of the Vercel deployment URL.
 * Order: SITE_URL → APP_URL → NEXT_PUBLIC_SITE_URL → NEXT_PUBLIC_APP_URL → VERCEL_URL → localhost.
 */
function normalizeBaseUrl(raw: string): string {
  const url = raw.endsWith('/') ? raw.slice(0, -1) : raw;
  if (url.startsWith('http://') || url.startsWith('https://')) return url;
  return `https://${url}`;
}

export function getAppBaseUrl(): string {
  const raw =
    process.env.SITE_URL?.trim() ||
    process.env.APP_URL?.trim() ||
    process.env.NEXT_PUBLIC_SITE_URL?.trim() ||
    process.env.NEXT_PUBLIC_APP_URL?.trim();
  if (raw) {
    return normalizeBaseUrl(raw);
  }
  // Avoid using Vercel deployment URL in emails; require explicit env for production domain
  if (process.env.VERCEL_URL) {
    return `https://${process.env.VERCEL_URL}`;
  }
  return 'http://localhost:3000';
}

/** Default "from" when RESEND_FROM_EMAIL is not set (Resend's testing address). Use RESEND_FROM_EMAIL with your verified domain to send from your domain. */
export const DEFAULT_FROM_EMAIL = 'Bookings <onboarding@resend.dev>';

export function getFromEmail(): string {
  return process.env.RESEND_FROM_EMAIL?.trim() || DEFAULT_FROM_EMAIL;
}
