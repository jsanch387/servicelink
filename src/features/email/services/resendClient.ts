/**
 * Resend client and app URL helpers.
 * Shared by all email sending in this feature.
 */

import { getAppBaseUrl as resolvePublicAppOrigin } from '@/libs/stripe/appBaseUrl';
import { Resend } from 'resend';

const resendApiKey = process.env.RESEND_API_KEY;

export function getResendClient(): Resend | null {
  if (!resendApiKey) return null;
  return new Resend(resendApiKey);
}

/**
 * Base URL for links in emails. Uses the canonical site origin — never a
 * Vercel preview host (those URLs are often auth-walled for customers).
 */
export function getAppBaseUrl(): string {
  return resolvePublicAppOrigin();
}

/** Default "from" when RESEND_FROM_EMAIL is not set (Resend's testing address). Use RESEND_FROM_EMAIL with your verified domain to send from your domain. */
export const DEFAULT_FROM_EMAIL = 'Bookings <onboarding@resend.dev>';

export function getFromEmail(): string {
  return process.env.RESEND_FROM_EMAIL?.trim() || DEFAULT_FROM_EMAIL;
}
