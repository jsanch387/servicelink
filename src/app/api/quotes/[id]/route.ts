import type {
  QuoteDbRow,
  QuotePublicLinkRow,
} from '@/features/quotes/dashboard/api/types';
import { mapQuoteRowToDashboardQuote } from '@/features/quotes/dashboard/server/mapQuoteRowToDashboardQuote';
import { createSupabaseServerClient } from '@/libs/supabase/server';
import { resolveCurrentBusinessId } from '@/server/resolveCurrentBusinessId';
import { NextResponse } from 'next/server';

interface RouteContext {
  params: Promise<{ id: string }>;
}

export async function GET(_req: Request, { params }: RouteContext) {
  try {
    const { id } = await params;
    const quoteId = id?.trim();
    if (!quoteId) {
      return NextResponse.json(
        { success: false, error: 'Quote id is required' },
        { status: 400 }
      );
    }

    const supabase = await createSupabaseServerClient();
    const resolved = await resolveCurrentBusinessId(supabase);

    if (!resolved.ok) {
      return NextResponse.json(
        { success: false, error: resolved.error },
        { status: resolved.status }
      );
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
          created_at,
          updated_at,
          scheduled_date,
          scheduled_start_time,
          note,
          vehicle_year,
          vehicle_make,
          vehicle_model
        `
      )
      .eq('business_id', resolved.businessId)
      .eq('id', quoteId)
      .maybeSingle();

    if (error) {
      console.error('quote detail error:', error);
      return NextResponse.json(
        { success: false, error: error.message || 'Failed to load quote' },
        { status: 500 }
      );
    }

    if (!data) {
      return NextResponse.json(
        { success: false, error: 'Quote not found' },
        { status: 404 }
      );
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: linkData, error: linkError } = await (supabase as any)
      .from('quote_public_links')
      .select(
        'quote_id, token_hash, is_active, revoked_at, expires_at, created_at'
      )
      .eq('quote_id', quoteId)
      .eq('is_active', true)
      .is('revoked_at', null)
      .gt('expires_at', new Date().toISOString())
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (linkError) {
      console.error('quote detail link error:', linkError);
    }

    const link = (linkData as QuotePublicLinkRow | null) ?? null;
    const quote = mapQuoteRowToDashboardQuote(
      data as QuoteDbRow,
      link?.token_hash ?? ''
    );
    return NextResponse.json({ success: true, quote });
  } catch (e) {
    console.error('quote detail GET:', e);
    return NextResponse.json(
      { success: false, error: 'Unexpected server error' },
      { status: 500 }
    );
  }
}
