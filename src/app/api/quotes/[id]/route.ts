import { loadDashboardQuoteById } from '@/features/quotes/dashboard/server/loadDashboardQuoteById';
import { isDashboardQuoteEditableByOwner } from '@/features/quotes/dashboard/utils/isDashboardQuoteEditableByOwner';
import { validateUpdateQuoteBody } from '@/features/quotes/edit/validateUpdateQuoteBody';
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

    return NextResponse.json({ success: true, quote: loaded.quote });
  } catch (e) {
    console.error('quote detail GET:', e);
    return NextResponse.json(
      { success: false, error: 'Unexpected server error' },
      { status: 500 }
    );
  }
}

export async function PATCH(request: Request, { params }: RouteContext) {
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

    const existing = await loadDashboardQuoteById(
      supabase,
      resolved.businessId,
      quoteId
    );
    if (!existing.ok) {
      return NextResponse.json(
        { success: false, error: existing.error },
        { status: existing.status }
      );
    }

    if (!isDashboardQuoteEditableByOwner(existing.quote.status)) {
      return NextResponse.json(
        {
          success: false,
          error:
            'This quote can no longer be edited after the customer has responded.',
        },
        { status: 409 }
      );
    }

    const parsed = validateUpdateQuoteBody(await request.json());
    if (!parsed.ok) {
      return NextResponse.json(
        { success: false, error: parsed.error },
        { status: parsed.status }
      );
    }

    const p = parsed.data;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error: updateError } = await (supabase as any)
      .from('quotes')
      .update({
        customer_name: p.customerName,
        customer_email: p.customerEmail,
        customer_phone: p.customerPhoneDigits,
        vehicle_year: p.vehicleYear,
        vehicle_make: p.vehicleMake,
        vehicle_model: p.vehicleModel,
        service_name: p.serviceName,
        price_cents: p.priceCents,
        duration_minutes: p.durationMinutes,
        note: p.note,
        scheduled_date: p.scheduledDate,
        scheduled_start_time: p.scheduledStartTimeForDb,
        service_id: p.serviceId,
        service_price_option_id: p.servicePriceOptionId,
        service_price_cents: p.servicePriceCents,
        addon_details: p.addonDetails,
        updated_at: new Date().toISOString(),
      })
      .eq('business_id', resolved.businessId)
      .eq('id', quoteId);

    if (updateError) {
      console.error('quote PATCH:', updateError);
      return NextResponse.json(
        { success: false, error: 'Failed to update quote' },
        { status: 500 }
      );
    }

    const refreshed = await loadDashboardQuoteById(
      supabase,
      resolved.businessId,
      quoteId
    );
    if (!refreshed.ok) {
      return NextResponse.json(
        { success: false, error: refreshed.error },
        { status: refreshed.status }
      );
    }

    return NextResponse.json({ success: true, quote: refreshed.quote });
  } catch (e) {
    console.error('quote PATCH:', e);
    return NextResponse.json(
      { success: false, error: 'Unexpected server error' },
      { status: 500 }
    );
  }
}

export async function DELETE(_req: Request, { params }: RouteContext) {
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
    const db = supabase as any;
    const { data: deletedRows, error: deleteError } = await db
      .from('quotes')
      .delete()
      .eq('id', quoteId)
      .eq('business_id', resolved.businessId)
      .select('id');

    if (deleteError) {
      console.error('quote DELETE:', deleteError);
      return NextResponse.json(
        { success: false, error: 'Failed to delete quote' },
        { status: 500 }
      );
    }

    const removed = Array.isArray(deletedRows) ? deletedRows.length : 0;
    if (removed === 0) {
      return NextResponse.json(
        { success: false, error: 'Quote not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (e) {
    console.error('quote DELETE:', e);
    return NextResponse.json(
      { success: false, error: 'Unexpected server error' },
      { status: 500 }
    );
  }
}
