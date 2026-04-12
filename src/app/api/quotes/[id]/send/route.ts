/**
 * POST /api/quotes/[id]/send
 *
 * Sends an existing quote that is still `requested` or `draft` (e.g. customer
 * request the owner is turning into a formal sent quote). Same side effects
 * as POST /api/quotes/send (link + email), without inserting a new row.
 */

import { sendExistingQuoteAsSent } from '@/features/quotes/server/sendExistingQuoteAsSent';
import { validateSendQuoteBody } from '@/features/quotes/send/validateSendQuoteBody';
import { loadDashboardQuoteById } from '@/features/quotes/dashboard/server/loadDashboardQuoteById';
import { createSupabaseAdminClient } from '@/libs/supabase/admin';
import { createSupabaseServerClient } from '@/libs/supabase/server';
import { resolveCurrentBusinessId } from '@/server/resolveCurrentBusinessId';
import { NextRequest, NextResponse } from 'next/server';

interface RouteContext {
  params: Promise<{ id: string }>;
}

export async function POST(request: NextRequest, { params }: RouteContext) {
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
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    let json: unknown;
    try {
      json = await request.json();
    } catch {
      return NextResponse.json(
        { success: false, error: 'Invalid JSON body' },
        { status: 400 }
      );
    }

    const parsed = validateSendQuoteBody(json);
    if (!parsed.ok) {
      return NextResponse.json(
        { success: false, error: parsed.error },
        { status: parsed.status }
      );
    }

    const resolved = await resolveCurrentBusinessId(supabase);
    if (!resolved.ok) {
      return NextResponse.json(
        { success: false, error: resolved.error },
        { status: resolved.status }
      );
    }

    const admin = createSupabaseAdminClient();

    const { data: business, error: businessError } = await admin
      .from('business_profiles')
      .select('id, business_slug, profile_id, business_name')
      .eq('business_slug', parsed.data.businessSlug)
      .maybeSingle();

    if (businessError || !business) {
      return NextResponse.json(
        { success: false, error: 'Business not found' },
        { status: 404 }
      );
    }

    const businessRow = business as {
      id: string;
      business_slug: string | null;
      profile_id: string | null;
      business_name: string | null;
    };

    if (
      businessRow.id !== resolved.businessId ||
      !businessRow.profile_id ||
      businessRow.profile_id !== user.id
    ) {
      return NextResponse.json(
        { success: false, error: 'Forbidden' },
        { status: 403 }
      );
    }

    const loaded = await loadDashboardQuoteById(
      supabase,
      resolved.businessId,
      quoteId
    );
    if (!loaded.ok) {
      return NextResponse.json(
        { success: false, error: loaded.error },
        { status: loaded.status }
      );
    }

    const businessDisplayName =
      businessRow.business_name?.trim() ||
      businessRow.business_slug?.trim() ||
      'Your service provider';

    const siteOrigin =
      process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, '') ||
      request.nextUrl.origin;

    const result = await sendExistingQuoteAsSent({
      admin,
      quoteId,
      businessId: resolved.businessId,
      ownerUserId: user.id,
      businessDisplayName,
      payload: parsed.data,
      siteOrigin,
    });

    if (!result.ok) {
      return NextResponse.json(
        { success: false, error: result.error },
        { status: result.status }
      );
    }

    return NextResponse.json(
      {
        success: true,
        data: {
          quoteId,
          publicUrl: result.publicUrl,
          expiresAt: result.expiresAt,
        },
      },
      { status: 200 }
    );
  } catch (e) {
    console.error('[API] POST /api/quotes/[id]/send', e);
    return NextResponse.json(
      { success: false, error: 'Unexpected server error' },
      { status: 500 }
    );
  }
}
