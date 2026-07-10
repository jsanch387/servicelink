import type {
  MarketingDeleteResponse,
  SaleDetailResponse,
  SaleUpdateResponse,
} from '@/features/marketing/api/types';
import { toggleSaleActive } from '@/features/marketing/server/createSale';
import {
  deleteSale,
  loadSaleById,
} from '@/features/marketing/server/loadSaleById';
import { updateSale } from '@/features/marketing/server/updateSale';
import { validateToggleActiveBody } from '@/features/marketing/server/validatePromoCodeBody';
import { validateCreateSaleBody } from '@/features/marketing/server/validateSaleBody';
import { createSupabaseServerClient } from '@/libs/supabase/server';
import { resolveCurrentBusinessId } from '@/server/resolveCurrentBusinessId';
import { NextResponse } from 'next/server';

interface RouteContext {
  params: Promise<{ id: string }>;
}

async function resolveSaleRouteContext(params: Promise<{ id: string }>) {
  const { id } = await params;
  const saleId = id?.trim();

  if (!saleId) {
    return {
      ok: false as const,
      response: NextResponse.json(
        { success: false, error: 'Sale id is required' },
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
    saleId,
  };
}

export async function GET(_request: Request, { params }: RouteContext) {
  try {
    const ctx = await resolveSaleRouteContext(params);
    if (!ctx.ok) return ctx.response;

    const loaded = await loadSaleById(ctx.supabase, ctx.businessId, ctx.saleId);

    if (!loaded.ok) {
      return NextResponse.json(
        { success: false, error: loaded.error } satisfies SaleDetailResponse,
        { status: loaded.status }
      );
    }

    return NextResponse.json({
      success: true,
      sale: loaded.sale,
    } satisfies SaleDetailResponse);
  } catch (err) {
    console.error('[marketing] GET /api/marketing/sales/[id] failed', err);
    return NextResponse.json(
      {
        success: false,
        error: 'Unexpected server error',
      } satisfies SaleDetailResponse,
      { status: 500 }
    );
  }
}

export async function PATCH(request: Request, { params }: RouteContext) {
  try {
    const ctx = await resolveSaleRouteContext(params);
    if (!ctx.ok) return ctx.response;

    const rawBody = await request.json().catch(() => null);
    const parsed = validateToggleActiveBody(rawBody);

    if (!parsed.ok) {
      return NextResponse.json(
        { success: false, error: parsed.error } satisfies SaleUpdateResponse,
        { status: 400 }
      );
    }

    const updated = await toggleSaleActive(
      ctx.supabase,
      ctx.businessId,
      ctx.saleId,
      parsed.value.isActive
    );

    if (!updated.ok) {
      return NextResponse.json(
        { success: false, error: updated.error } satisfies SaleUpdateResponse,
        { status: updated.status }
      );
    }

    return NextResponse.json({
      success: true,
      sale: updated.sale,
    } satisfies SaleUpdateResponse);
  } catch (err) {
    console.error('[marketing] PATCH /api/marketing/sales/[id] failed', err);
    return NextResponse.json(
      {
        success: false,
        error: 'Unexpected server error',
      } satisfies SaleUpdateResponse,
      { status: 500 }
    );
  }
}

export async function PUT(request: Request, { params }: RouteContext) {
  try {
    const ctx = await resolveSaleRouteContext(params);
    if (!ctx.ok) return ctx.response;

    const rawBody = await request.json().catch(() => null);
    const parsed = validateCreateSaleBody(rawBody);

    if (!parsed.ok) {
      return NextResponse.json(
        { success: false, error: parsed.error } satisfies SaleUpdateResponse,
        { status: 400 }
      );
    }

    const updated = await updateSale(
      ctx.supabase,
      ctx.businessId,
      ctx.saleId,
      parsed.value
    );

    if (!updated.ok) {
      return NextResponse.json(
        { success: false, error: updated.error } satisfies SaleUpdateResponse,
        { status: updated.status }
      );
    }

    return NextResponse.json({
      success: true,
      sale: updated.sale,
    } satisfies SaleUpdateResponse);
  } catch (err) {
    console.error('[marketing] PUT /api/marketing/sales/[id] failed', err);
    return NextResponse.json(
      {
        success: false,
        error: 'Unexpected server error',
      } satisfies SaleUpdateResponse,
      { status: 500 }
    );
  }
}

export async function DELETE(_request: Request, { params }: RouteContext) {
  try {
    const ctx = await resolveSaleRouteContext(params);
    if (!ctx.ok) return ctx.response;

    const deleted = await deleteSale(ctx.supabase, ctx.businessId, ctx.saleId);

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
    console.error('[marketing] DELETE /api/marketing/sales/[id] failed', err);
    return NextResponse.json(
      {
        success: false,
        error: 'Unexpected server error',
      } satisfies MarketingDeleteResponse,
      { status: 500 }
    );
  }
}
