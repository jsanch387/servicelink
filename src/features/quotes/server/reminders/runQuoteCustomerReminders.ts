/**
 * Cron entry for `/api/internal/cron/quote-customer-reminders`.
 * One email + SMS nudge per unanswered sent quote, 2–3 days after send.
 */

import { mapWithConcurrency } from '@/features/availability/booking/server/reminders/mapWithConcurrency';
import type { SupabaseClient } from '@supabase/supabase-js';
import { QUOTE_CUSTOMER_REMINDER_SEND_CONCURRENCY } from './constants';
import {
  loadOpenSentQuotesForCustomerReminder,
  loadQuoteCustomerReminderBusinesses,
} from './loadOpenSentQuotesForCustomerReminder';
import { notifyCustomerForQuoteReminder } from './notifyCustomerForQuoteReminder';

export type QuoteCustomerRemindersRunResult = {
  found: number;
  considered: number;
  emailSent: number;
  smsSent: number;
  duplicate: number;
  failed: number;
};

export async function runQuoteCustomerReminders(
  supabase: SupabaseClient,
  params?: {
    now?: Date;
    dryRun?: boolean;
    onlyQuoteId?: string | null;
  }
): Promise<QuoteCustomerRemindersRunResult> {
  const now = params?.now ?? new Date();
  const result: QuoteCustomerRemindersRunResult = {
    found: 0,
    considered: 0,
    emailSent: 0,
    smsSent: 0,
    duplicate: 0,
    failed: 0,
  };

  const quotes = await loadOpenSentQuotesForCustomerReminder(supabase, now);
  if (quotes === null) {
    result.failed += 1;
    return result;
  }

  const onlyQuoteId = params?.onlyQuoteId?.trim() || '';
  const filtered = onlyQuoteId
    ? quotes.filter(row => row.id === onlyQuoteId)
    : quotes;

  result.found = filtered.length;
  if (filtered.length === 0) return result;

  const businesses = await loadQuoteCustomerReminderBusinesses(
    supabase,
    filtered.map(row => row.business_id)
  );

  result.considered = filtered.length;
  if (params?.dryRun) return result;

  const outcomes = await mapWithConcurrency(
    filtered,
    QUOTE_CUSTOMER_REMINDER_SEND_CONCURRENCY,
    row =>
      notifyCustomerForQuoteReminder(supabase, {
        quoteId: row.id,
        businessId: row.business_id,
        businessName: businesses.get(row.business_id)?.businessName ?? '',
        customerName: row.customerName,
        customerEmail: row.customerEmail,
        customerPhone: row.customerPhone,
        serviceName: row.serviceName,
        publicQuoteUrl: row.publicQuoteUrl,
        expiresAt: row.expiresAt,
        now,
      })
  );

  for (const outcome of outcomes) {
    if (!outcome.claimed) {
      result.duplicate += 1;
      continue;
    }
    if (outcome.email === 'sent') result.emailSent += 1;
    if (outcome.sms === 'sent') result.smsSent += 1;
    if (outcome.email === 'failed' || outcome.sms === 'failed') {
      result.failed += 1;
    }
  }

  return result;
}
