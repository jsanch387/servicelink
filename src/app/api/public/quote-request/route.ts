/**
 * POST /api/public/quote-request
 *
 * Public quote request from business profile (`/[slug]/quote`). No auth.
 */

import { insertCustomerQuoteRequest } from '@/features/quotes/public-request/server/insertCustomerQuoteRequest';
import { validatePublicQuoteRequestBody } from '@/features/quotes/public-request/validatePublicQuoteRequestBody';
import { createSupabaseAdminClient } from '@/libs/supabase/admin';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    let json: unknown;
    try {
      json = await request.json();
    } catch {
      return NextResponse.json(
        { success: false, error: 'Invalid JSON body' },
        { status: 400 }
      );
    }

    const parsed = validatePublicQuoteRequestBody(json);
    if (!parsed.ok) {
      return NextResponse.json(
        { success: false, error: parsed.error },
        { status: parsed.status }
      );
    }

    const admin = createSupabaseAdminClient();

    const { data: profile, error: profileError } = await admin
      .from('business_profiles')
      .select('id')
      .eq('business_slug', parsed.data.businessSlug)
      .maybeSingle();

    if (profileError || !profile) {
      return NextResponse.json(
        { success: false, error: 'Business not found' },
        { status: 404 }
      );
    }

    const businessId = (profile as { id: string }).id;

    const inserted = await insertCustomerQuoteRequest(
      admin,
      businessId,
      parsed.data
    );

    if (!inserted.ok) {
      return NextResponse.json(
        { success: false, error: inserted.error },
        { status: 500 }
      );
    }

    console.info(
      '[quote-request] saved',
      JSON.stringify({
        quoteId: inserted.quoteId,
        businessId,
        slug: parsed.data.businessSlug,
      })
    );

    return NextResponse.json(
      { success: true, data: { quoteId: inserted.quoteId } },
      { status: 201 }
    );
  } catch (e) {
    console.error('[API] POST /api/public/quote-request', e);
    return NextResponse.json(
      { success: false, error: 'Unexpected server error' },
      { status: 500 }
    );
  }
}
