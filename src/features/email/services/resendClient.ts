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
 * Checks NEXT_PUBLIC_SITE_URL, then NEXT_PUBLIC_APP_URL, then VERCEL_URL, then localhost.
 */
export function getAppBaseUrl(): string {
  const url =
    process.env.NEXT_PUBLIC_SITE_URL?.trim() ||
    process.env.NEXT_PUBLIC_APP_URL?.trim();
  if (url) {
    return url.endsWith('/') ? url.slice(0, -1) : url;
  }
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
