import type { QuoteCommunication } from '@/features/quotes/shared/quoteOutboundEvents';
import {
  isQuoteOutboundChannel,
  isQuoteOutboundStatus,
  isQuoteOutboundType,
} from '@/features/quotes/shared/quoteOutboundEvents';
import type { SupabaseClient } from '@supabase/supabase-js';

type EventRow = {
  quote_id?: string | null;
  channel?: string | null;
  type?: string | null;
  status?: string | null;
  sent_at?: string | null;
  to_address?: string | null;
};

function toCommunication(row: EventRow): QuoteCommunication | null {
  const channel = row.channel?.trim() ?? '';
  const type = row.type?.trim() ?? '';
  const status = row.status?.trim() ?? '';
  const sentAt = row.sent_at?.trim() ?? '';
  if (
    !isQuoteOutboundChannel(channel) ||
    !isQuoteOutboundType(type) ||
    !isQuoteOutboundStatus(status) ||
    !sentAt
  ) {
    return null;
  }
  return {
    channel,
    type,
    status,
    sentAt,
    toAddress: row.to_address?.trim() || null,
  };
}

/**
 * Owner-readable communication timeline for one quote.
 * Empty list on query failure so quote detail still loads.
 */
export async function loadQuoteOutboundEvents(
  supabase: SupabaseClient,
  quoteId: string
): Promise<QuoteCommunication[]> {
  const map = await loadQuoteOutboundEventsByQuoteIds(supabase, [quoteId]);
  return map.get(quoteId.trim()) ?? [];
}

/** Batch load for the owner quote list. */
export async function loadQuoteOutboundEventsByQuoteIds(
  supabase: SupabaseClient,
  quoteIds: readonly string[]
): Promise<Map<string, QuoteCommunication[]>> {
  const ids = [...new Set(quoteIds.map(id => id.trim()).filter(Boolean))];
  const map = new Map<string, QuoteCommunication[]>();
  if (ids.length === 0) return map;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data, error } = await (supabase as any)
    .from('quote_outbound_events')
    .select('quote_id, channel, type, status, sent_at, to_address')
    .in('quote_id', ids)
    .order('sent_at', { ascending: true });

  if (error) {
    console.warn('[quote-outbound-event] load failed', {
      message: error.message,
    });
    return map;
  }

  for (const row of (data ?? []) as EventRow[]) {
    const quoteId = row.quote_id?.trim();
    const event = toCommunication(row);
    if (!quoteId || !event) continue;
    const list = map.get(quoteId) ?? [];
    list.push(event);
    map.set(quoteId, list);
  }
  return map;
}
