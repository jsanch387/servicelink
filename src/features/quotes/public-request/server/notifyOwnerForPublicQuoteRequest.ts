/**
 * In-app notification + owner email after a public “request quote” submission.
 * Best-effort; failures must not affect the HTTP response (row already inserted).
 */

import {
  sendQuoteRequestOwnerNotificationEmail,
  type QuoteRequestOwnerNotificationPayload,
} from '@/features/email';
import type { Database } from '@/libs/supabase/client';
import type { SupabaseClient } from '@supabase/supabase-js';

/** Matches `DETAILS_MAX_LEN` in validatePublicQuoteRequestBody (full customer message in email). */
const DETAILS_EMAIL_MAX = 700;

function truncateForEmail(text: string, max: number): string {
  const t = text.trim();
  if (t.length <= max) return t;
  return `${t.slice(0, max - 1)}…`;
}

function buildVehicleSummary(
  year: string | null,
  make: string | null,
  model: string | null
): string | null {
  const parts = [year, make, model].map(p => (p ?? '').trim()).filter(Boolean);
  return parts.length ? parts.join(' ') : null;
}

export async function notifyOwnerForPublicQuoteRequest(
  admin: SupabaseClient,
  params: {
    profileId: string;
    quoteId: string;
    customerName: string;
    serviceName: string;
    vehicleYear: string | null;
    vehicleMake: string | null;
    vehicleModel: string | null;
    timeline: string | null;
    details: string;
  }
): Promise<void> {
  const {
    profileId,
    quoteId,
    customerName,
    serviceName,
    vehicleYear,
    vehicleMake,
    vehicleModel,
    timeline,
    details,
  } = params;

  const title = `New quote request from ${customerName}`;
  const bodyText = serviceName ? `Service: ${serviceName}` : null;
  try {
    const notificationRow: Database['public']['Tables']['notifications']['Insert'] =
      {
        user_id: profileId,
        type: 'quote_request',
        reference_type: 'quote',
        reference_id: quoteId,
        title,
        body: bodyText,
      };
    await admin.from('notifications').insert(notificationRow as never);
  } catch {
    // Quote row already saved
  }

  // Same as booking-request submit: owner address lives on Supabase Auth, not business_profiles.
  let ownerEmail: string | null = null;
  try {
    const {
      data: { user },
    } = await admin.auth.admin.getUserById(profileId);
    ownerEmail = user?.email?.trim() ?? null;
  } catch {
    // Owner email unavailable from auth
  }

  if (!ownerEmail) {
    console.warn(
      '[notifyOwnerForPublicQuoteRequest] No owner email; skipping Resend',
      { quoteId, profileId }
    );
    return;
  }

  const payload: QuoteRequestOwnerNotificationPayload = {
    customerName,
    serviceName,
    vehicleSummary: buildVehicleSummary(vehicleYear, vehicleMake, vehicleModel),
    timeline,
    detailsPreview: truncateForEmail(details, DETAILS_EMAIL_MAX),
  };

  try {
    const result = await sendQuoteRequestOwnerNotificationEmail(
      ownerEmail,
      payload
    );
    if (!result.sent) {
      console.warn('[notifyOwnerForPublicQuoteRequest] Email not sent', {
        quoteId,
        error: result.error,
      });
    }
  } catch (e) {
    console.warn('[notifyOwnerForPublicQuoteRequest] Email error', {
      quoteId,
      message: e instanceof Error ? e.message : String(e),
    });
  }
}
