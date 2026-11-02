/**
 * Write-once timeline row for a customer email or SMS on a quote.
 * Unique on (quote_id, channel, type) so retries do not duplicate.
 */

import type { SupabaseClient } from '@supabase/supabase-js';
import type {
  QuoteOutboundChannel,
  QuoteOutboundStatus,
  QuoteOutboundType,
} from '@/features/quotes/shared/quoteOutboundEvents';

const UNIQUE_VIOLATION = '23505';

export async function recordQuoteOutboundEvent(
  supabase: SupabaseClient,
  params: {
    quoteId: string;
    businessId: string;
    channel: QuoteOutboundChannel;
    type: QuoteOutboundType;
    status: QuoteOutboundStatus;
    toAddress?: string | null;
    smsMessageId?: string | null;
    sentAt?: Date;
  }
): Promise<void> {
  const quoteId = params.quoteId.trim();
  const businessId = params.businessId.trim();
  if (!quoteId || !businessId) return;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error } = await (supabase as any)
    .from('quote_outbound_events')
    .insert({
      quote_id: quoteId,
      business_id: businessId,
      channel: params.channel,
      type: params.type,
      status: params.status,
      sent_at: (params.sentAt ?? new Date()).toISOString(),
      to_address: params.toAddress?.trim() || null,
      sms_message_id: params.smsMessageId?.trim() || null,
    });

  if (error && error.code !== UNIQUE_VIOLATION) {
    console.warn('[quote-outbound-event] insert failed', {
      quoteId,
      channel: params.channel,
      type: params.type,
      message: error.message,
    });
  }
}
