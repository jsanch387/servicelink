import type { SupabaseClient } from '@supabase/supabase-js';

import { ASSISTANT_BETA_TEXT_LIMIT } from '../constants/assistantBetaLimits';

export type AssistantTextUsage = {
  yearMonth: string;
  sent: number;
  limit: number;
  remaining: number;
};

export function assistantYearMonthUtc(now: Date = new Date()): string {
  const year = now.getUTCFullYear();
  const month = String(now.getUTCMonth() + 1).padStart(2, '0');
  return `${year}-${month}`;
}

export async function getAssistantTextUsage(
  admin: SupabaseClient,
  businessId: string,
  now: Date = new Date()
): Promise<AssistantTextUsage> {
  const yearMonth = assistantYearMonthUtc(now);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const db = admin as any;
  const { data, error } = await db
    .from('assistant_usage_months')
    .select('text_sent_count')
    .eq('business_id', businessId)
    .eq('year_month', yearMonth)
    .maybeSingle();

  if (error) {
    console.error('[assistant] usage read failed', error);
    throw new Error('Failed to load Assistant usage');
  }

  const sent =
    typeof data?.text_sent_count === 'number' ? data.text_sent_count : 0;
  const limit = ASSISTANT_BETA_TEXT_LIMIT;
  return {
    yearMonth,
    sent,
    limit,
    remaining: Math.max(0, limit - sent),
  };
}

/**
 * Reserve `count` text sends for this month. Returns the new usage, or
 * `limit_reached` when the batch would exceed the beta cap.
 */
export async function reserveAssistantTextUsage(
  admin: SupabaseClient,
  businessId: string,
  count: number,
  now: Date = new Date()
): Promise<
  | { ok: true; usage: AssistantTextUsage }
  | { ok: false; reason: 'limit_reached' | 'invalid_count'; usage: AssistantTextUsage }
> {
  if (!Number.isInteger(count) || count < 1) {
    const usage = await getAssistantTextUsage(admin, businessId, now);
    return { ok: false, reason: 'invalid_count', usage };
  }

  const yearMonth = assistantYearMonthUtc(now);
  const limit = ASSISTANT_BETA_TEXT_LIMIT;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const db = admin as any;

  const current = await getAssistantTextUsage(admin, businessId, now);
  if (current.sent + count > limit) {
    return { ok: false, reason: 'limit_reached', usage: current };
  }

  const nextCount = current.sent + count;
  const { error } = await db.from('assistant_usage_months').upsert(
    {
      business_id: businessId,
      year_month: yearMonth,
      text_sent_count: nextCount,
      updated_at: new Date().toISOString(),
    },
    { onConflict: 'business_id,year_month' }
  );

  if (error) {
    console.error('[assistant] usage reserve failed', error);
    throw new Error('Failed to reserve Assistant usage');
  }

  return {
    ok: true,
    usage: {
      yearMonth,
      sent: nextCount,
      limit,
      remaining: Math.max(0, limit - nextCount),
    },
  };
}

/** Best-effort rollback after a failed send log. */
export async function releaseAssistantTextUsage(
  admin: SupabaseClient,
  businessId: string,
  count: number,
  now: Date = new Date()
): Promise<void> {
  if (!Number.isInteger(count) || count < 1) return;

  const yearMonth = assistantYearMonthUtc(now);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const db = admin as any;
  const current = await getAssistantTextUsage(admin, businessId, now);
  const nextCount = Math.max(0, current.sent - count);

  const { error } = await db.from('assistant_usage_months').upsert(
    {
      business_id: businessId,
      year_month: yearMonth,
      text_sent_count: nextCount,
      updated_at: new Date().toISOString(),
    },
    { onConflict: 'business_id,year_month' }
  );

  if (error) {
    console.error('[assistant] usage release failed', error);
  }
}
