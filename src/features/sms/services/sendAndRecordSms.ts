/**
 * Send an SMS and log it to `sms_messages` in one call.
 *
 * Claim-first + idempotent: a row is inserted (status `queued`) BEFORE sending,
 * keyed by an optional `dedupeKey` with a UNIQUE constraint. If the key already
 * exists (e.g. a Stripe webhook retry), we skip the send entirely — the
 * customer is never double-texted. After sending, the row is updated to `sent`
 * or `failed`.
 *
 * Best-effort: never throws. A logging failure does not block the customer SMS,
 * and an SMS failure is still recorded for the history screen.
 *
 * Writes use the **service role (admin) client** — `sms_messages` has no owner
 * INSERT policy by design (see migration). Callers must pass an admin client.
 */

import type { Database } from '@/libs/supabase/client';
import { supabaseErrorForLogs } from '@/server/logging/structuredLog';
import type { SupabaseClient } from '@supabase/supabase-js';
import { isSmsOutboundEnabled } from '../config/isSmsOutboundEnabled';
import { canBusinessSendCustomerSms } from '../server/canBusinessSendCustomerSms';
import { logSms } from '../server/smsLog';
import { sendSms, type SendSmsResult } from './sendSms';
import { isTelnyxSmsConfigured } from './telnyxClient';
import { toE164 } from '../utils/toE164';

export interface SendAndRecordSmsParams {
  /** Service-role client (e.g. `createSupabaseAdminClient()`). */
  admin: SupabaseClient<Database>;
  businessId: string;
  bookingId?: string | null;
  customerId?: string | null;
  /** Logical message type, e.g. `booking_confirmation`, `on_the_way`. */
  type: string;
  /** Raw/E.164 phone. Invalid numbers are recorded as failed, not sent. */
  to: string | null | undefined;
  message: string;
  /**
   * Idempotency key (UNIQUE in `sms_messages`). When a row with this key exists,
   * the send is skipped. e.g. `"<bookingId>:booking_confirmation"`.
   */
  dedupeKey?: string | null;
  correlationId?: string;
}

export type SendAndRecordSmsResult =
  | { sent: true; messageId: string | null }
  | {
      sent: false;
      reason:
        | 'no_phone'
        | 'invalid_number'
        | 'duplicate'
        | 'not_configured'
        | 'not_eligible'
        | 'error';
    };

const UNIQUE_VIOLATION = '23505';

export async function sendAndRecordSms(
  params: SendAndRecordSmsParams
): Promise<SendAndRecordSmsResult> {
  const { admin, type, message, correlationId } = params;

  const rawPhone = params.to?.trim() || '';
  if (!rawPhone) {
    // Nothing to send (e.g. booking with no phone); nothing to log.
    logSms(correlationId, 'info', 'skip_no_phone', { type });
    return { sent: false, reason: 'no_phone' };
  }

  if (!isSmsOutboundEnabled()) {
    logSms(correlationId, 'info', 'skip_outbound_disabled', { type });
    return { sent: false, reason: 'not_configured' };
  }

  // Infra / entitlement skips: do not insert — avoids flooding sms_messages with
  // noise from free-tier businesses or environments without Telnyx credentials.
  if (!isTelnyxSmsConfigured()) {
    logSms(correlationId, 'warn', 'skip_not_configured', { type });
    return { sent: false, reason: 'not_configured' };
  }

  const eligibility = await canBusinessSendCustomerSms(
    admin,
    params.businessId
  );
  if (!eligibility.ok) {
    logSms(correlationId, 'info', 'skip_not_eligible', {
      type,
      businessId: params.businessId,
      reason: eligibility.reason,
    });
    return { sent: false, reason: 'not_eligible' };
  }

  const phone = toE164(rawPhone);

  // 1. Claim/log the attempt first (idempotent via dedupe_key).
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: inserted, error: insertError } = await (admin as any)
    .from('sms_messages')
    .insert({
      business_id: params.businessId,
      booking_id: params.bookingId ?? null,
      customer_id: params.customerId ?? null,
      type,
      channel: 'sms',
      direction: 'outbound',
      to_phone: phone ?? rawPhone,
      body: message,
      status: 'queued',
      provider: 'telnyx',
      dedupe_key: params.dedupeKey ?? null,
    })
    .select('id')
    .single();

  let messageId: string | null = null;
  if (insertError) {
    if (insertError.code === UNIQUE_VIOLATION) {
      // A message with this dedupe key already exists — already sent/handled.
      logSms(correlationId, 'info', 'skip_duplicate', { type });
      return { sent: false, reason: 'duplicate' };
    }
    // Logging failed for another reason (e.g. table missing). Don't block the
    // customer SMS — send without a row.
    logSms(correlationId, 'warn', 'log_insert_failed', {
      type,
      ...supabaseErrorForLogs(insertError),
    });
  } else {
    messageId = (inserted as { id: string }).id;
  }

  // 2. Invalid phone: record failure (if we have a row) and stop. Clear the
  // dedupe key so a later retry (e.g. after the phone is corrected) is allowed.
  if (!phone) {
    if (messageId) {
      await updateRow(admin, messageId, {
        status: 'failed',
        error: 'invalid_number',
        dedupe_key: null,
      });
    }
    return { sent: false, reason: 'invalid_number' };
  }

  // 3. Send.
  const result = await sendSms({
    to: phone,
    type,
    message,
    correlationId,
  });

  // 4. Record the outcome.
  if (messageId) {
    if (result.sent) {
      await updateRow(admin, messageId, {
        status: 'sent',
        sent_at: new Date().toISOString(),
        provider_message_id: result.providerMessageId,
      });
    } else {
      // Clear the dedupe key so the owner can retry a failed send.
      await updateRow(admin, messageId, {
        status: 'failed',
        error: smsFailureErrorForDb(result),
        dedupe_key: null,
      });
    }
  }

  return result.sent
    ? { sent: true, messageId }
    : { sent: false, reason: result.reason };
}

/** Persist a useful failure string in `sms_messages.error` (not just `"error"`). */
function smsFailureErrorForDb(
  result: Extract<SendSmsResult, { sent: false }>
): string {
  if (result.reason === 'error' && result.detail) {
    return result.detail;
  }
  return result.reason;
}

async function updateRow(
  admin: SupabaseClient<Database>,
  id: string,
  patch: {
    status: string;
    error?: string;
    sent_at?: string;
    dedupe_key?: string | null;
    provider_message_id?: string | null;
  }
): Promise<void> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error } = await (admin as any)
    .from('sms_messages')
    .update(patch)
    .eq('id', id);
  if (error) {
    logSms(undefined, 'warn', 'log_update_failed', {
      id,
      ...supabaseErrorForLogs(error),
    });
  }
}
