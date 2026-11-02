import { buildPublicQuoteUrl } from '@/features/quotes/shared/utils/buildPublicQuoteUrl';
import type { SupabaseClient } from '@supabase/supabase-js';
import { QUOTE_CUSTOMER_REMINDER_STATUSES } from './constants';
import { quoteCustomerReminderBounds } from './quoteCustomerReminderDate';

const PAGE_SIZE = 200;

export type QuoteCustomerReminderRow = {
  id: string;
  business_id: string;
  customerName: string;
  customerEmail: string | null;
  customerPhone: string | null;
  serviceName: string;
  publicQuoteUrl: string;
  expiresAt: string | null;
};

type QuotePageRow = {
  id?: string | null;
  business_id?: string | null;
  sent_at?: string | null;
  status?: string | null;
  customer_name?: string | null;
  customer_email?: string | null;
  customer_phone?: string | null;
  service_name?: string | null;
  expires_at?: string | null;
};

type LinkRow = {
  quote_id?: string | null;
  token_hash?: string | null;
  expires_at?: string | null;
};

export type QuoteCustomerReminderBusiness = {
  businessName: string;
};

/**
 * Sent/viewed quotes in the 2–3 day window, still unanswered, not yet nudged,
 * with a live public `/q/` link. `null` means the query failed.
 */
export async function loadOpenSentQuotesForCustomerReminder(
  supabase: SupabaseClient,
  now: Date = new Date()
): Promise<QuoteCustomerReminderRow[] | null> {
  const { sentOnOrBeforeIso, sentOnOrAfterIso } =
    quoteCustomerReminderBounds(now);
  const nowIso = now.toISOString();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const db = supabase as any;

  const quotes: QuotePageRow[] = [];
  let offset = 0;

  while (true) {
    const { data, error } = await db
      .from('quotes')
      .select(
        'id, business_id, sent_at, status, customer_name, customer_email, customer_phone, service_name, expires_at'
      )
      .in('status', [...QUOTE_CUSTOMER_REMINDER_STATUSES])
      .is('customer_reminder_sent_at', null)
      .not('sent_at', 'is', null)
      .lte('sent_at', sentOnOrBeforeIso)
      .gte('sent_at', sentOnOrAfterIso)
      .order('id', { ascending: true })
      .range(offset, offset + PAGE_SIZE - 1);

    if (error) {
      console.warn('[quote-customer-reminder] quotes page failed', {
        offset,
        message: error.message,
      });
      return null;
    }

    const page = (data ?? []) as QuotePageRow[];
    quotes.push(...page);
    if (page.length < PAGE_SIZE) break;
    offset += PAGE_SIZE;
  }

  const quoteIds = quotes
    .map(row => row.id?.trim())
    .filter((id): id is string => Boolean(id));
  const linksByQuoteId = await loadActivePublicLinks(db, quoteIds, nowIso);
  if (linksByQuoteId === null) return null;

  const rows: QuoteCustomerReminderRow[] = [];
  for (const row of quotes) {
    const id = row.id?.trim();
    const businessId = row.business_id?.trim();
    if (!id || !businessId) continue;

    const quoteExpiresAt = row.expires_at?.trim() || null;
    if (quoteExpiresAt && quoteExpiresAt <= nowIso) continue;

    const link = linksByQuoteId.get(id);
    if (!link) continue;

    const customerEmail = row.customer_email?.trim() || null;
    const customerPhone = row.customer_phone?.trim() || null;
    if (!customerEmail && !customerPhone) continue;

    rows.push({
      id,
      business_id: businessId,
      customerName: row.customer_name?.trim() || '',
      customerEmail,
      customerPhone,
      serviceName: row.service_name?.trim() || 'Quote',
      publicQuoteUrl: buildPublicQuoteUrl(link.tokenHash),
      expiresAt: link.expiresAt,
    });
  }

  return rows;
}

async function loadActivePublicLinks(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  db: any,
  quoteIds: string[],
  nowIso: string
): Promise<Map<
  string,
  { tokenHash: string; expiresAt: string | null }
> | null> {
  const map = new Map<
    string,
    { tokenHash: string; expiresAt: string | null }
  >();
  if (quoteIds.length === 0) return map;

  for (let i = 0; i < quoteIds.length; i += PAGE_SIZE) {
    const chunk = quoteIds.slice(i, i + PAGE_SIZE);
    const { data, error } = await db
      .from('quote_public_links')
      .select('quote_id, token_hash, expires_at')
      .in('quote_id', chunk)
      .eq('is_active', true)
      .is('revoked_at', null)
      .gt('expires_at', nowIso);

    if (error) {
      console.warn('[quote-customer-reminder] public links query failed', {
        message: error.message,
      });
      return null;
    }

    for (const row of (data ?? []) as LinkRow[]) {
      const quoteId = row.quote_id?.trim();
      const tokenHash = row.token_hash?.trim();
      if (!quoteId || !tokenHash || map.has(quoteId)) continue;
      map.set(quoteId, {
        tokenHash,
        expiresAt: row.expires_at?.trim() || null,
      });
    }
  }

  return map;
}

export async function loadQuoteCustomerReminderBusinesses(
  supabase: SupabaseClient,
  businessIds: string[]
): Promise<Map<string, QuoteCustomerReminderBusiness>> {
  const unique = [...new Set(businessIds.map(id => id.trim()).filter(Boolean))];
  const map = new Map<string, QuoteCustomerReminderBusiness>();
  if (unique.length === 0) return map;

  const { data, error } = await supabase
    .from('business_profiles')
    .select('id, business_name')
    .in('id', unique);

  if (error) {
    console.warn('[quote-customer-reminder] businesses query failed', {
      message: error.message,
    });
    return map;
  }

  for (const row of data ?? []) {
    const id = (row as { id?: string | null }).id?.trim();
    if (!id) continue;
    map.set(id, {
      businessName:
        (row as { business_name?: string | null }).business_name?.trim() || '',
    });
  }
  return map;
}
