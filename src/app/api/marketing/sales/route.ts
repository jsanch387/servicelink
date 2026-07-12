import type {
  SaleCreateResponse,
  SalesListResponse,
} from '@/features/marketing/api/types';
import { createSale } from '@/features/marketing/server/createSale';
import { loadDashboardSales } from '@/features/marketing/server/loadDashboardSales';
import { validateCreateSaleBody } from '@/features/marketing/server/validateSaleBody';
import { createSupabaseServerClient } from '@/libs/supabase/server';
import { resolveCurrentBusinessId } from '@/server/resolveCurrentBusinessId';
import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const supabase = await createSupabaseServerClient();
    const resolved = await resolveCurrentBusinessId(supabase);

    if (!resolved.ok) {
      return NextResponse.json(
        { success: false, error: resolved.error } satisfies SalesListResponse,
        { status: resolved.status }
      );
    }

    const loaded = await loadDashboardSales(supabase, resolved.businessId);

    if (!loaded.ok) {
      return NextResponse.json(
        { success: false, error: loaded.error } satisfies SalesListResponse,
        { status: loaded.status }
      );
    }

    return NextResponse.json({
      success: true,
      sales: loaded.sales,
    } satisfies SalesListResponse);
  } catch (err) {
    console.error('[marketing] GET /api/marketing/sales failed', err);
    return NextResponse.json(
      {
        success: false,
        error: 'Unexpected server error',
      } satisfies SalesListResponse,
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
        { success: false, error: resolved.error } satisfies SaleCreateResponse,
        { status: resolved.status }
      );
    }

    const rawBody = await request.json().catch(() => null);
    const parsed = validateCreateSaleBody(rawBody);

    if (!parsed.ok) {
      return NextResponse.json(
        { success: false, error: parsed.error } satisfies SaleCreateResponse,
        { status: 400 }
      );
    }

    const created = await createSale(
      supabase,
      resolved.businessId,
      parsed.value
    );

    if (!created.ok) {
      return NextResponse.json(
        { success: false, error: created.error } satisfies SaleCreateResponse,
        { status: created.status }
      );
    }

    return NextResponse.json({
      success: true,
      sale: created.sale,
    } satisfies SaleCreateResponse);
  } catch (err) {
    console.error('[marketing] POST /api/marketing/sales failed', err);
    return NextResponse.json(
      {
        success: false,
        error: 'Unexpected server error',
      } satisfies SaleCreateResponse,
      { status: 500 }
    );
  }
}
