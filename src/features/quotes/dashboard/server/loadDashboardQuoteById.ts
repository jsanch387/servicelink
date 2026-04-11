import type {
  QuoteDbRow,
  QuotePublicLinkRow,
} from '@/features/quotes/dashboard/api/types';
import { mapQuoteRowToDashboardQuote } from '@/features/quotes/dashboard/server/mapQuoteRowToDashboardQuote';
import type { DashboardQuote } from '@/features/quotes/dashboard/types';
import type { SupabaseClient } from '@supabase/supabase-js';

export type LoadDashboardQuoteResult =
  | { ok: true; quote: DashboardQuote }
  | { ok: false; status: number; error: string };

/**
 * Loads a single quote for the owner dashboard (scoped by `businessId`).
 */
export async function loadDashboardQuoteById(
  supabase: SupabaseClient,
  businessId: string,
  quoteId: string
): Promise<LoadDashboardQuoteResult> {
  const id = quoteId.trim();
  if (!id) {
    return { ok: false, status: 400, error: 'Quote id is required' };
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data, error } = await (supabase as any)
    .from('quotes')
    .select(
      `
          id,
          status,
          source,
          customer_name,
          customer_email,
          customer_phone,
          service_name,
          price_cents,
          duration_minutes,
          created_at,
          updated_at,
          scheduled_date,
          scheduled_start_time,
          note,
          request_message,
          vehicle_year,
          vehicle_make,
          vehicle_model,
          customer_street_address,
          customer_unit_apt,
          customer_city,
          customer_state,
          customer_zip,
          service_address
        `
    )
    .eq('business_id', businessId)
    .eq('id', id)
    .maybeSingle();

  if (error) {
    console.error('loadDashboardQuoteById:', error);
    return {
      ok: false,
      status: 500,
      error: error.message || 'Failed to load quote',
    };
  }

  if (!data) {
    return { ok: false, status: 404, error: 'Quote not found' };
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: linkData, error: linkError } = await (supabase as any)
    .from('quote_public_links')
    .select(
      'quote_id, token_hash, is_active, revoked_at, expires_at, created_at'
    )
    .eq('quote_id', id)
    .eq('is_active', true)
    .is('revoked_at', null)
    .gt('expires_at', new Date().toISOString())
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  if (linkError) {
    console.error('loadDashboardQuoteById link:', linkError);
  }

  const link = (linkData as QuotePublicLinkRow | null) ?? null;
  const quote = mapQuoteRowToDashboardQuote(
    data as QuoteDbRow,
    link?.token_hash ?? ''
  );

  return { ok: true, quote };
}
