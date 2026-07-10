import type {
  PromoCodeCreateResponse,
  PromoCodesListResponse,
} from '@/features/marketing/api/types';
import { createPromoCode } from '@/features/marketing/server/createPromoCode';
import { loadDashboardPromoCodes } from '@/features/marketing/server/loadDashboardPromoCodes';
import { validateCreatePromoCodeBody } from '@/features/marketing/server/validatePromoCodeBody';
import { createSupabaseServerClient } from '@/libs/supabase/server';
import { resolveCurrentBusinessId } from '@/server/resolveCurrentBusinessId';
import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const supabase = await createSupabaseServerClient();
    const resolved = await resolveCurrentBusinessId(supabase);

    if (!resolved.ok) {
      return NextResponse.json(
        {
          success: false,
          error: resolved.error,
        } satisfies PromoCodesListResponse,
        { status: resolved.status }
      );
    }

    const loaded = await loadDashboardPromoCodes(supabase, resolved.businessId);

    if (!loaded.ok) {
      return NextResponse.json(
        {
          success: false,
          error: loaded.error,
        } satisfies PromoCodesListResponse,
        { status: loaded.status }
      );
    }

    return NextResponse.json({
      success: true,
      promoCodes: loaded.promoCodes,
    } satisfies PromoCodesListResponse);
  } catch (err) {
    console.error('[marketing] GET /api/marketing/promo-codes failed', err);
    return NextResponse.json(
      {
        success: false,
        error: 'Unexpected server error',
      } satisfies PromoCodesListResponse,
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const supabase = await createSupabaseServerClient();
    const resolved = await resolveCurrentBusinessId(supabase);

    if (!resolved.ok) {
      return NextResponse.json(
        {
          success: false,
          error: resolved.error,
        } satisfies PromoCodeCreateResponse,
        { status: resolved.status }
      );
    }

    const rawBody = await request.json().catch(() => null);
    const parsed = validateCreatePromoCodeBody(rawBody);

    if (!parsed.ok) {
      return NextResponse.json(
        {
          success: false,
          error: parsed.error,
        } satisfies PromoCodeCreateResponse,
        { status: 400 }
      );
    }

    const created = await createPromoCode(
      supabase,
      resolved.businessId,
      parsed.value
    );

    if (!created.ok) {
      return NextResponse.json(
        {
          success: false,
          error: created.error,
        } satisfies PromoCodeCreateResponse,
        { status: created.status }
      );
    }

    return NextResponse.json({
      success: true,
      promoCode: created.promoCode,
    } satisfies PromoCodeCreateResponse);
  } catch (err) {
    console.error('[marketing] POST /api/marketing/promo-codes failed', err);
    return NextResponse.json(
      {
        success: false,
        error: 'Unexpected server error',
      } satisfies PromoCodeCreateResponse,
      { status: 500 }
    );
  }
}
