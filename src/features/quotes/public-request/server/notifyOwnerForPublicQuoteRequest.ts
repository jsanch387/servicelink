/**
 * In-app notification + owner email after a public “request quote” submission.
 * Insert-first so a retry cannot send a second push or email.
 * Best-effort; failures must not affect the HTTP response (row already inserted).
 */

import {
  sendQuoteRequestOwnerNotificationEmail,
  type QuoteRequestOwnerNotificationPayload,
} from '@/features/email';
import {
  notificationInboxSubtitleFromCustomer,
  notificationMinimalDisplayTitle,
} from '@/features/notifications/utils/notificationMinimalDisplayTitle';
import { formatQuoteRequestVehicleLine } from '@/features/quotes/public-request/buildQuoteRequestNote';
import { sendExpoPushToUser } from '@/features/push/server/sendExpoPushToUser';
import type { Database } from '@/libs/supabase/client';
import type { SupabaseClient } from '@supabase/supabase-js';

/** Matches `DETAILS_MAX_LEN` in validatePublicQuoteRequestBody (full customer message in email). */
const DETAILS_EMAIL_MAX = 700;
const UNIQUE_VIOLATION = '23505';

function postgresErrorCode(error: unknown): string {
  if (
    typeof error === 'object' &&
    error &&
    'code' in error &&
    typeof (error as { code?: unknown }).code === 'string'
  ) {
    return (error as { code: string }).code;
  }
  return '';
}

function truncateForEmail(text: string, max: number): string {
  const t = text.trim();
  if (t.length <= max) return t;
  return `${t.slice(0, max - 1)}…`;
}

function buildVehicleSummary(
  year: string | null,
  make: string | null,
  model: string | null,
  year2?: string | null,
  make2?: string | null,
  model2?: string | null
): string | null {
  const first = formatQuoteRequestVehicleLine(year, make, model);
  const second = formatQuoteRequestVehicleLine(year2, make2, model2);
  const parts = [first, second].filter(Boolean);
  return parts.length ? parts.join(' · ') : null;
}

export function quoteRequestNewDedupeKey(quoteId: string): string {
  return `quote_request:${quoteId.trim()}`;
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
    vehicle2Year?: string | null;
    vehicle2Make?: string | null;
    vehicle2Model?: string | null;
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
    vehicle2Year,
    vehicle2Make,
    vehicle2Model,
    timeline,
    details,
  } = params;

  const title = notificationMinimalDisplayTitle('quote_request', 'quote', '');
  const bodyText = notificationInboxSubtitleFromCustomer(customerName);
  const notificationRow: Database['public']['Tables']['notifications']['Insert'] =
    {
      user_id: profileId,
      type: 'quote_request',
      reference_type: 'quote',
      reference_id: quoteId,
      title,
      body: bodyText,
      dedupe_key: quoteRequestNewDedupeKey(quoteId),
    };

  const { error: notifError } = await admin
    .from('notifications')
    .insert(notificationRow as never);

  if (notifError) {
    if (postgresErrorCode(notifError) === UNIQUE_VIOLATION) {
      return;
    }
    console.warn(
      '[notifyOwnerForPublicQuoteRequest] notification insert failed',
      { quoteId, profileId, message: notifError.message }
    );
    return;
  }

  await sendExpoPushToUser(admin, {
    userId: profileId,
    title,
    body: bodyText,
    data: { reference_type: 'quote', reference_id: quoteId },
  });

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
    vehicleSummary: buildVehicleSummary(
      vehicleYear,
      vehicleMake,
      vehicleModel,
      vehicle2Year,
      vehicle2Make,
      vehicle2Model
    ),
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
