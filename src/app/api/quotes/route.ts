import type {
  QuoteDbRow,
  QuotePublicLinkRow,
} from '@/features/quotes/dashboard/api/types';
import { mapQuoteRowToDashboardQuote } from '@/features/quotes/dashboard/server/mapQuoteRowToDashboardQuote';
import { createSupabaseServerClient } from '@/libs/supabase/server';
import { resolveCurrentBusinessId } from '@/server/resolveCurrentBusinessId';
import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const supabase = await createSupabaseServerClient();
    const resolved = await resolveCurrentBusinessId(supabase);

    if (!resolved.ok) {
      return NextResponse.json(
        { success: false, error: resolved.error },
        { status: resolved.status }
      );
    }

    const businessId = resolved.businessId;

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
          service_address,
          service_id,
          service_price_cents,
          addon_details
        `
      )
      .eq('business_id', businessId)
      .order('updated_at', { ascending: false });

    if (error) {
      console.error('quotes list error:', error);
      return NextResponse.json(
        { success: false, error: error.message || 'Failed to load quotes' },
        { status: 500 }
      );
    }

    const rows = (data ?? []) as QuoteDbRow[];
    const quoteIds = rows.map(row => row.id);

    const tokenByQuoteId = new Map<string, string>();
    if (quoteIds.length > 0) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data: linksData, error: linksError } = await (supabase as any)
        .from('quote_public_links')
        .select(
          'quote_id, token_hash, is_active, revoked_at, expires_at, created_at'
        )
        .in('quote_id', quoteIds)
        .eq('is_active', true)
        .is('revoked_at', null)
        .gt('expires_at', new Date().toISOString())
        .order('created_at', { ascending: false });

      if (linksError) {
        console.error('quotes links list error:', linksError);
      } else {
        const links = (linksData ?? []) as QuotePublicLinkRow[];
        for (const link of links) {
          // Keep newest active link per quote (query is already newest first).
          if (!tokenByQuoteId.has(link.quote_id)) {
            tokenByQuoteId.set(link.quote_id, link.token_hash);
          }
        }
      }
    }

    const quotes = rows.map(row =>
      mapQuoteRowToDashboardQuote(row, tokenByQuoteId.get(row.id) ?? '')
    );

    return NextResponse.json({ success: true, quotes });
  } catch (e) {
    console.error('quotes GET:', e);
    return NextResponse.json(
      { success: false, error: 'Unexpected server error' },
      { status: 500 }
    );
  }
}
