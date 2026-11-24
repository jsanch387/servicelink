import type { SupabaseClient } from '@supabase/supabase-js';

export type AssistantDecisionKind = 'skipped' | 'unskipped' | 'sent';

export type AssistantDecisionSubject =
  | 'review_followup'
  | 'rebook_checkin';

export type AssistantActionWrite = {
  customerId: string;
  bookingId?: string | null;
  subject: AssistantDecisionSubject;
  kind: AssistantDecisionKind;
  /** Unique per write for idempotency within the business. */
  dedupeKey: string;
  payload?: Record<string, unknown>;
  smsMessageId?: string | null;
};

/**
 * Append decision rows to `assistant_actions`. Service-role client required.
 */
export async function recordAssistantActions(
  admin: SupabaseClient,
  input: {
    businessId: string;
    actorUserId: string | null;
    actor?: 'owner' | 'assistant' | 'system';
    actions: readonly AssistantActionWrite[];
  }
): Promise<
  | { ok: true; created: boolean }
  | { ok: false; error: string }
> {
  if (input.actions.length === 0) return { ok: true, created: false };

  const rows = input.actions.map(action => ({
    business_id: input.businessId,
    customer_id: action.customerId,
    booking_id: action.bookingId ?? null,
    sms_message_id: action.smsMessageId ?? null,
    actor: input.actor ?? 'owner',
    actor_user_id: input.actorUserId,
    kind: action.kind,
    subject: action.subject,
    dedupe_key: action.dedupeKey.slice(0, 200),
    payload: action.payload ?? {},
  }));

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const db = admin as any;
  const { error } = await db.from('assistant_actions').insert(rows);

  if (error) {
    // Unique violation: already recorded (idempotent retry).
    if (error.code === '23505') {
      return { ok: true, created: false };
    }
    console.error('[assistant] action insert failed', error);
    return { ok: false, error: 'Failed to record Assistant action' };
  }

  return { ok: true, created: true };
}

export function assistantSmsDedupeKey(input: {
  customerId: string;
  subject: AssistantDecisionSubject;
  at?: Date;
}): string {
  const day = (input.at ?? new Date()).toISOString().slice(0, 10);
  return `assistant:${input.customerId}:${input.subject}:${day}`;
}

export function assistantSmsType(
  subject: AssistantDecisionSubject
): 'assistant_review_followup' | 'assistant_rebook_checkin' {
  return subject === 'review_followup'
    ? 'assistant_review_followup'
    : 'assistant_rebook_checkin';
}

export function assistantSendDedupeKey(input: {
  customerId: string;
  subject: AssistantDecisionSubject;
  at?: Date;
}): string {
  const day = (input.at ?? new Date()).toISOString().slice(0, 10);
  return `sent:${input.customerId}:${input.subject}:${day}`;
}

export function assistantSkipDedupeKey(input: {
  customerId: string;
  subject: AssistantDecisionSubject;
  at?: Date;
}): string {
  const stamp = (input.at ?? new Date()).toISOString();
  return `skipped:${input.customerId}:${input.subject}:${stamp}`;
}
