import type {
  MarketingDeleteResponse,
  PromoCodeDetailResponse,
  PromoCodeUpdateResponse,
} from '@/features/marketing/api/types';
import { togglePromoCodeActive } from '@/features/marketing/server/createPromoCode';
import {
  deletePromoCode,
  loadPromoCodeById,
} from '@/features/marketing/server/loadPromoCodeById';
import { updatePromoCode } from '@/features/marketing/server/updatePromoCode';
import {
  validateCreatePromoCodeBody,
  validateToggleActiveBody,
} from '@/features/marketing/server/validatePromoCodeBody';
import { createSupabaseServerClient } from '@/libs/supabase/server';
import { resolveCurrentBusinessId } from '@/server/resolveCurrentBusinessId';
import { NextResponse } from 'next/server';

interface RouteContext {
  params: Promise<{ id: string }>;
}

async function resolvePromoCodeRouteContext(params: Promise<{ id: string }>) {
  const { id } = await params;
  const promoCodeId = id?.trim();

  if (!promoCodeId) {
    return {
      ok: false as const,
      response: NextResponse.json(
        { success: false, error: 'Promo code id is required' },
        { status: 400 }
      ),
    };
  }

  const supabase = await createSupabaseServerClient();
  const resolved = await resolveCurrentBusinessId(supabase);

  if (!resolved.ok) {
    return {
      ok: false as const,
      response: NextResponse.json(
        { success: false, error: resolved.error },
        { status: resolved.status }
      ),
    };
  }

  return {
    ok: true as const,
    supabase,
    businessId: resolved.businessId,
    promoCodeId,
  };
}

export async function GET(_request: Request, { params }: RouteContext) {
  try {
    const ctx = await resolvePromoCodeRouteContext(params);
    if (!ctx.ok) return ctx.response;

    const loaded = await loadPromoCodeById(
      ctx.supabase,
      ctx.businessId,
      ctx.promoCodeId
    );

    if (!loaded.ok) {
      return NextResponse.json(
        {
          success: false,
          error: loaded.error,
        } satisfies PromoCodeDetailResponse,
        { status: loaded.status }
      );
    }

    return NextResponse.json({
      success: true,
      promoCode: loaded.promoCode,
    } satisfies PromoCodeDetailResponse);
  } catch (err) {
    console.error(
      '[marketing] GET /api/marketing/promo-codes/[id] failed',
      err
    );
    return NextResponse.json(
      {
        success: false,
        error: 'Unexpected server error',
      } satisfies PromoCodeDetailResponse,
      { status: 500 }
    );
  }
}

export async function PATCH(request: Request, { params }: RouteContext) {
  try {
    const ctx = await resolvePromoCodeRouteContext(params);
    if (!ctx.ok) return ctx.response;

    const rawBody = await request.json().catch(() => null);
    const parsed = validateToggleActiveBody(rawBody);

    if (!parsed.ok) {
      return NextResponse.json(
        {
          success: false,
          error: parsed.error,
        } satisfies PromoCodeUpdateResponse,
        { status: 400 }
      );
    }

    const updated = await togglePromoCodeActive(
      ctx.supabase,
      ctx.businessId,
      ctx.promoCodeId,
      parsed.value.isActive
    );

    if (!updated.ok) {
      return NextResponse.json(
        {
          success: false,
          error: updated.error,
        } satisfies PromoCodeUpdateResponse,
        { status: updated.status }
      );
    }

    return NextResponse.json({
      success: true,
      promoCode: updated.promoCode,
    } satisfies PromoCodeUpdateResponse);
  } catch (err) {
    console.error(
      '[marketing] PATCH /api/marketing/promo-codes/[id] failed',
      err
    );
    return NextResponse.json(
      {
        success: false,
        error: 'Unexpected server error',
      } satisfies PromoCodeUpdateResponse,
      { status: 500 }
    );
  }
}

export async function PUT(request: Request, { params }: RouteContext) {
  try {
    const ctx = await resolvePromoCodeRouteContext(params);
    if (!ctx.ok) return ctx.response;

    const rawBody = await request.json().catch(() => null);
    const parsed = validateCreatePromoCodeBody(rawBody);

    if (!parsed.ok) {
      return NextResponse.json(
        {
          success: false,
          error: parsed.error,
        } satisfies PromoCodeUpdateResponse,
        { status: 400 }
      );
    }

    const updated = await updatePromoCode(
      ctx.supabase,
      ctx.businessId,
      ctx.promoCodeId,
      parsed.value
    );

    if (!updated.ok) {
      return NextResponse.json(
        {
          success: false,
          error: updated.error,
        } satisfies PromoCodeUpdateResponse,
        { status: updated.status }
      );
    }

    return NextResponse.json({
      success: true,
      promoCode: updated.promoCode,
    } satisfies PromoCodeUpdateResponse);
  } catch (err) {
    console.error(
      '[marketing] PUT /api/marketing/promo-codes/[id] failed',
      err
    );
    return NextResponse.json(
      {
        success: false,
        error: 'Unexpected server error',
      } satisfies PromoCodeUpdateResponse,
      { status: 500 }
    );
  }
}

export async function DELETE(_request: Request, { params }: RouteContext) {
  try {
    const ctx = await resolvePromoCodeRouteContext(params);
    if (!ctx.ok) return ctx.response;

    const deleted = await deletePromoCode(
      ctx.supabase,
      ctx.businessId,
      ctx.promoCodeId
    );

    if (!deleted.ok) {
      return NextResponse.json(
        {
          success: false,
          error: deleted.error,
        } satisfies MarketingDeleteResponse,
        { status: deleted.status }
      );
    }

    return NextResponse.json({
      success: true,
    } satisfies MarketingDeleteResponse);
  } catch (err) {
    console.error(
      '[marketing] DELETE /api/marketing/promo-codes/[id] failed',
      err
    );
    return NextResponse.json(
      {
        success: false,
        error: 'Unexpected server error',
      } satisfies MarketingDeleteResponse,
      { status: 500 }
    );
  }
}
