import {
  sendQuoteSentToCustomerEmail,
  type QuoteSentToCustomerPayload,
} from '@/features/email';
import type { ValidatedSendQuoteBody } from '@/features/quotes/send/validateSendQuoteBody';
import type { SupabaseClient } from '@supabase/supabase-js';
import crypto from 'crypto';

export type SendExistingQuoteAsSentResult =
  | { ok: true; publicUrl: string; expiresAt: string }
  | { ok: false; error: string; status: number };

const SENDABLE_STATUSES = ['requested', 'draft'] as const;

/**
 * Updates an existing quote row to `sent`, creates a public link, and emails
 * the customer. Used when converting a customer request (or draft) into a
 * sent quote — same outcome as `POST /api/quotes/send` for new rows.
 */
export async function sendExistingQuoteAsSent(params: {
  admin: SupabaseClient;
  quoteId: string;
  businessId: string;
  ownerUserId: string;
  businessDisplayName: string;
  payload: ValidatedSendQuoteBody;
  /** e.g. `request.nextUrl.origin` or `NEXT_PUBLIC_SITE_URL` */
  siteOrigin: string;
}): Promise<SendExistingQuoteAsSentResult> {
  const {
    admin,
    quoteId,
    businessId,
    ownerUserId,
    businessDisplayName,
    payload: p,
    siteOrigin,
  } = params;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const db = admin as any;

  const { data: row, error: loadErr } = await db
    .from('quotes')
    .select('id, status, business_id, request_message')
    .eq('id', quoteId)
    .eq('business_id', businessId)
    .maybeSingle();

  if (loadErr || !row) {
    return { ok: false, error: 'Quote not found', status: 404 };
  }

  const rowTyped = row as {
    status: string;
    request_message: string | null;
  };
  const status = rowTyped.status;
  const customerRequestForEmail = rowTyped.request_message?.trim() || null;
  if (
    !SENDABLE_STATUSES.includes(status as (typeof SENDABLE_STATUSES)[number])
  ) {
    return {
      ok: false,
      error:
        'This quote has already been sent. Use save to update details, or create a new quote.',
      status: 409,
    };
  }

  const now = new Date().toISOString();

  const { data: updated, error: updateError } = await db
    .from('quotes')
    .update({
      customer_name: p.customerName,
      customer_email: p.customerEmail,
      customer_phone: p.customerPhoneDigits,
      vehicle_year: p.vehicleYear,
      vehicle_make: p.vehicleMake,
      vehicle_model: p.vehicleModel,
      service_name: p.serviceName,
      price_cents: p.priceCents,
      duration_minutes: p.durationMinutes,
      note: p.note,
      scheduled_date: p.scheduledDate,
      scheduled_start_time: p.scheduledStartTimeForDb,
      service_id: p.serviceId,
      service_price_option_id: p.servicePriceOptionId,
      service_price_cents: p.servicePriceCents,
      addon_details: p.addonDetails,
      status: 'sent',
      sent_at: now,
      created_by_user_id: ownerUserId,
      updated_at: now,
    })
    .eq('id', quoteId)
    .eq('business_id', businessId)
    .in('status', [...SENDABLE_STATUSES])
    .select('id');

  if (updateError) {
    console.error('[sendExistingQuoteAsSent] update', updateError);
    return {
      ok: false,
      error: 'Could not send quote. Please try again.',
      status: 500,
    };
  }

  const updatedRows = updated as { id: string }[] | null;
  if (!updatedRows?.length) {
    return {
      ok: false,
      error:
        'This quote is no longer in a state that can be sent. Refresh and try again.',
      status: 409,
    };
  }

  await db
    .from('quote_public_links')
    .update({
      is_active: false,
      revoked_at: now,
    })
    .eq('quote_id', quoteId)
    .eq('is_active', true);

  const rawToken = crypto.randomBytes(32).toString('base64url');
  const tokenHash = crypto.createHash('sha256').update(rawToken).digest('hex');
  const expiresAt = new Date(
    Date.now() + 1000 * 60 * 60 * 24 * 14
  ).toISOString();

  const { error: linkError } = await db.from('quote_public_links').insert({
    quote_id: quoteId,
    token_hash: tokenHash,
    expires_at: expiresAt,
    is_active: true,
  });

  if (linkError) {
    console.error('[sendExistingQuoteAsSent] link', linkError);
    return {
      ok: false,
      error: 'Could not create quote link. Please try again.',
      status: 500,
    };
  }

  const origin = siteOrigin.replace(/\/$/, '');
  const publicUrl = `${origin}/q/${rawToken}`;

  const vehicleLine =
    [p.vehicleYear, p.vehicleMake, p.vehicleModel]
      .map(v => (v ?? '').trim())
      .filter(Boolean)
      .join(' ') || null;

  try {
    const emailPayload: QuoteSentToCustomerPayload = {
      customerName: p.customerName,
      serviceName: p.serviceName,
      businessName: businessDisplayName,
      priceCents: p.priceCents,
      scheduledDate: p.scheduledDate,
      scheduledStartTime: p.scheduledStartTimeForDb,
      durationMinutes: p.durationMinutes,
      note: p.note,
      customerRequestMessage: customerRequestForEmail,
      vehicleLine,
      publicQuoteUrl: publicUrl,
      addonDetails: p.addonDetails,
    };
    const emailResult = await sendQuoteSentToCustomerEmail(
      p.customerEmail,
      emailPayload
    );
    if (!emailResult.sent) {
      console.warn(
        '[sendExistingQuoteAsSent] customer email not sent:',
        emailResult.error
      );
    }
  } catch (emailErr) {
    console.warn('[sendExistingQuoteAsSent] customer email error', emailErr);
  }

  return { ok: true, publicUrl, expiresAt };
}
