import type { SupabaseClient } from '@supabase/supabase-js';
import { QUOTE_CUSTOMER_REMINDER_STATUSES } from './constants';

/**
 * Claim the one-shot customer nudge. Returns false if already claimed or
 * the quote is no longer sent/viewed (accepted, declined, expired, …).
 */
export async function claimQuoteCustomerReminder(
  supabase: SupabaseClient,
  quoteId: string,
  now: Date = new Date()
): Promise<boolean> {
  const id = quoteId.trim();
  if (!id) return false;

  const nowIso = now.toISOString();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const db = supabase as any;
  const { data, error } = await db
    .from('quotes')
    .update({
      customer_reminder_sent_at: nowIso,
      updated_at: nowIso,
    })
    .eq('id', id)
    .is('customer_reminder_sent_at', null)
    .in('status', [...QUOTE_CUSTOMER_REMINDER_STATUSES])
    .select('id')
    .maybeSingle();

  if (error) {
    console.warn('[quote-customer-reminder] claim failed', {
      quoteId: id,
      message: error.message,
    });
    return false;
  }

  return Boolean((data as { id?: string } | null)?.id);
}
