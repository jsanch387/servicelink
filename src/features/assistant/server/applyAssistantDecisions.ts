import type { SupabaseClient } from '@supabase/supabase-js';
import {
  sendAndRecordSms,
  type SendAndRecordSmsResult,
} from '@/features/sms';
import {
  injectReviewUrlIntoBody,
  resolveAssistantReviewInviteUrl,
} from '@/features/reviews/server/resolveAssistantReviewInviteUrl';

import {
  assistantSendDedupeKey,
  assistantSkipDedupeKey,
  assistantSmsDedupeKey,
  assistantSmsType,
  recordAssistantActions,
  type AssistantDecisionSubject,
} from './recordAssistantActions';
import {
  getAssistantTextUsage,
  reserveAssistantTextUsage,
  type AssistantTextUsage,
} from './assistantUsageMonth';

export const ASSISTANT_DECISION_BATCH_LIMIT = 20;

export type AssistantDecisionItem = {
  customerId: string;
  bookingId?: string | null;
  subject: AssistantDecisionSubject;
  body?: string;
};

export type AssistantSendItemResult = {
  customerId: string;
  subject: AssistantDecisionSubject;
  ok: boolean;
  reason?: string;
  smsMessageId?: string | null;
};

export type ApplyAssistantDecisionsResult =
  | {
      ok: true;
      recorded: number;
      usage: AssistantTextUsage;
      results?: AssistantSendItemResult[];
    }
  | {
      ok: false;
      status: 400 | 409 | 500;
      error: string;
      code?: 'limit_reached' | 'invalid_body';
      usage?: AssistantTextUsage;
      results?: AssistantSendItemResult[];
    };

function normalizeItems(
  items: readonly AssistantDecisionItem[]
): AssistantDecisionItem[] | null {
  if (!Array.isArray(items) || items.length === 0) return null;
  if (items.length > ASSISTANT_DECISION_BATCH_LIMIT) return null;

  const normalized: AssistantDecisionItem[] = [];
  for (const item of items) {
    const customerId =
      typeof item.customerId === 'string' ? item.customerId.trim() : '';
    const subject = item.subject;
    if (!customerId) return null;
    if (subject !== 'review_followup' && subject !== 'rebook_checkin') {
      return null;
    }
    normalized.push({
      customerId,
      bookingId: item.bookingId ?? null,
      subject,
      body: typeof item.body === 'string' ? item.body : undefined,
    });
  }
  return normalized;
}

export async function applyAssistantSkip(input: {
  admin: SupabaseClient;
  businessId: string;
  actorUserId: string;
  items: readonly AssistantDecisionItem[];
}): Promise<ApplyAssistantDecisionsResult> {
  const items = normalizeItems(input.items);
  if (!items) {
    return {
      ok: false,
      status: 400,
      error: 'Provide 1–20 valid Assistant items',
      code: 'invalid_body',
    };
  }

  const usage = await getAssistantTextUsage(input.admin, input.businessId);
  const recorded = await recordAssistantActions(input.admin, {
    businessId: input.businessId,
    actorUserId: input.actorUserId,
    actor: 'owner',
    actions: items.map(item => ({
      customerId: item.customerId,
      bookingId: item.bookingId,
      subject: item.subject,
      kind: 'skipped' as const,
      dedupeKey: assistantSkipDedupeKey({
        customerId: item.customerId,
        subject: item.subject,
      }),
      payload: {},
    })),
  });

  if (!recorded.ok) {
    return { ok: false, status: 500, error: recorded.error };
  }

  return { ok: true, recorded: items.length, usage };
}

/**
 * Send Assistant texts via Telnyx + sms_messages, then log decisions and
 * count quota only for deliveries (and same-day duplicates).
 */
export async function applyAssistantSend(input: {
  admin: SupabaseClient;
  businessId: string;
  actorUserId: string;
  items: readonly AssistantDecisionItem[];
}): Promise<ApplyAssistantDecisionsResult> {
  const items = normalizeItems(input.items);
  if (!items) {
    return {
      ok: false,
      status: 400,
      error: 'Provide 1–20 valid Assistant items',
      code: 'invalid_body',
    };
  }

  let usage = await getAssistantTextUsage(input.admin, input.businessId);
  if (usage.remaining <= 0) {
    return {
      ok: false,
      status: 409,
      error: 'Monthly Assistant text limit reached',
      code: 'limit_reached',
      usage,
      results: items.map(item => ({
        customerId: item.customerId,
        subject: item.subject,
        ok: false,
        reason: 'limit_reached',
      })),
    };
  }

  const phones = await loadCustomerPhones(
    input.admin,
    input.businessId,
    items.map(item => item.customerId)
  );

  const results: AssistantSendItemResult[] = [];
  let recorded = 0;

  for (const item of items) {
    if (usage.remaining <= 0) {
      results.push({
        customerId: item.customerId,
        subject: item.subject,
        ok: false,
        reason: 'limit_reached',
      });
      continue;
    }

    const rawBody = item.body?.trim() || '';
    if (!rawBody) {
      results.push({
        customerId: item.customerId,
        subject: item.subject,
        ok: false,
        reason: 'invalid_body',
      });
      continue;
    }

    const preparedBody = await prepareAssistantMessageBody(
      input.admin,
      input.businessId,
      item,
      rawBody
    );
    if (!preparedBody.ok) {
      results.push({
        customerId: item.customerId,
        subject: item.subject,
        ok: false,
        reason: preparedBody.reason,
      });
      continue;
    }
    const body = preparedBody.body;

    const phone = phones.get(item.customerId) ?? null;
    const sms = await sendAndRecordSms({
      admin: input.admin as never,
      businessId: input.businessId,
      bookingId: item.bookingId ?? null,
      customerId: item.customerId,
      type: assistantSmsType(item.subject),
      to: phone,
      message: body,
      dedupeKey: assistantSmsDedupeKey({
        customerId: item.customerId,
        subject: item.subject,
      }),
    });

    const delivered = isAssistantSmsDelivered(sms);
    if (!delivered) {
      results.push({
        customerId: item.customerId,
        subject: item.subject,
        ok: false,
        reason: sms.reason,
      });
      continue;
    }

    const smsMessageId = sms.sent ? sms.messageId : null;
    const action = await recordAssistantActions(input.admin, {
      businessId: input.businessId,
      actorUserId: input.actorUserId,
      actor: 'owner',
      actions: [
        {
          customerId: item.customerId,
          bookingId: item.bookingId,
          subject: item.subject,
          kind: 'sent',
          dedupeKey: assistantSendDedupeKey({
            customerId: item.customerId,
            subject: item.subject,
          }),
          smsMessageId,
          payload: { body },
        },
      ],
    });

    if (!action.ok) {
      results.push({
        customerId: item.customerId,
        subject: item.subject,
        ok: false,
        reason: 'record_failed',
        smsMessageId,
      });
      continue;
    }

    // Only burn quota when we create a new sent action (not an idempotent retry).
    if (action.created) {
      const reserved = await reserveAssistantTextUsage(
        input.admin,
        input.businessId,
        1
      );
      if (reserved.ok) {
        usage = reserved.usage;
      } else {
        usage = reserved.usage;
      }
    } else {
      usage = await getAssistantTextUsage(input.admin, input.businessId);
    }

    recorded += 1;
    results.push({
      customerId: item.customerId,
      subject: item.subject,
      ok: true,
      smsMessageId,
    });
  }

  // Batch completed with zero deliveries → surface a hard error when every
  // item failed for the same infra reason (e.g. SMS not configured).
  if (recorded === 0 && results.every(r => !r.ok)) {
    const firstReason = results[0]?.reason;
    if (firstReason === 'limit_reached') {
      return {
        ok: false,
        status: 409,
        error: 'Monthly Assistant text limit reached',
        code: 'limit_reached',
        usage,
        results,
      };
    }
    return {
      ok: true,
      recorded: 0,
      usage,
      results,
    };
  }

  return {
    ok: true,
    recorded,
    usage,
    results,
  };
}

function isAssistantSmsDelivered(sms: SendAndRecordSmsResult): boolean {
  if (sms.sent) return true;
  // Same-day dedupe: already delivered; complete Assistant bookkeeping.
  return sms.reason === 'duplicate';
}

async function prepareAssistantMessageBody(
  admin: SupabaseClient,
  businessId: string,
  item: AssistantDecisionItem,
  body: string
): Promise<
  | { ok: true; body: string }
  | { ok: false; reason: string }
> {
  if (item.subject !== 'review_followup') {
    return { ok: true, body };
  }

  // Prepare already minted a link into the draft — keep the owner's edit.
  if (!body.includes('[review link]') && /\/review\/[A-Za-z0-9_-]+/.test(body)) {
    return { ok: true, body };
  }

  const resolved = await resolveAssistantReviewInviteUrl(admin, {
    businessId,
    customerId: item.customerId,
    bookingId: item.bookingId,
  });

  if (!resolved.ok) {
    return {
      ok: false,
      reason:
        resolved.reason === 'already_reviewed'
          ? 'already_reviewed'
          : resolved.reason === 'no_booking'
            ? 'no_booking'
            : 'review_link_failed',
    };
  }

  return {
    ok: true,
    body: injectReviewUrlIntoBody(body, resolved.url),
  };
}

async function loadCustomerPhones(
  admin: SupabaseClient,
  businessId: string,
  customerIds: readonly string[]
): Promise<Map<string, string | null>> {
  const unique = [...new Set(customerIds)];
  const map = new Map<string, string | null>();
  if (unique.length === 0) return map;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const db = admin as any;
  const { data, error } = await db
    .from('customers')
    .select('id, phone')
    .eq('business_id', businessId)
    .in('id', unique);

  if (error) {
    console.error('[assistant] customer phone load failed', error);
    return map;
  }

  for (const row of (data ?? []) as { id: string; phone: string | null }[]) {
    map.set(row.id, row.phone);
  }
  return map;
}
