import type { CustomerDbRow } from '@/features/customer-management/api/customerDbRow';
import { mapCustomerRowToRecord } from '@/features/customer-management/api/mapCustomerRowToRecord';
import {
  aggregateBookingsPerCustomer,
  type BookingRowForCustomerMetrics,
} from '@/features/customer-management/server/aggregateBookingsPerCustomer';
import { createSupabaseServerClient } from '@/libs/supabase/server';
import { resolveCurrentBusinessId } from '@/server/resolveCurrentBusinessId';
import { NextResponse } from 'next/server';

function withHttps(url: string): string {
  const trimmed = url.trim();
  if (!trimmed) return trimmed;
  if (/^https?:\/\//i.test(trimmed)) return trimmed;
  return `https://${trimmed}`;
}

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
    const {
      data: businessProfile,
      error: businessProfileError,
    }: {
      data: {
        business_name: string | null;
        business_slug: string | null;
        business_link: string | null;
      } | null;
      error: unknown;
    } = await supabase
      .from('business_profiles')
      .select('business_name, business_slug, business_link')
      .eq('id', businessId)
      .single();

    if (businessProfileError) {
      return NextResponse.json(
        { success: false, error: 'Failed to load business profile' },
        { status: 500 }
      );
    }

    const baseUrl = (
      process.env.NEXT_PUBLIC_SITE_URL || 'https://myservicelink.app'
    ).replace(/\/$/, '');
    const businessBookingLink = businessProfile?.business_link
      ? withHttps(businessProfile.business_link)
      : businessProfile?.business_slug
        ? `${baseUrl}/${encodeURIComponent(businessProfile.business_slug)}`
        : `${baseUrl}/businessname`;

    const { data: rows, error } = await supabase
      .from('customers')
      .select('*')
      .eq('business_id', businessId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('customers list error:', error);
      return NextResponse.json(
        { success: false, error: error.message || 'Failed to load customers' },
        { status: 500 }
      );
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: bookingRows, error: bookingError } = await (supabase as any)
      .from('bookings')
      .select(
        'customer_id, service_name, service_price_cents, addon_details, scheduled_date, start_time, status, created_at'
      )
      .eq('business_id', businessId)
      .not('customer_id', 'is', null);

    if (bookingError) {
      console.error('customers list bookings error:', bookingError);
      return NextResponse.json(
        {
          success: false,
          error: bookingError.message || 'Failed to load booking metrics',
        },
        { status: 500 }
      );
    }

    const metricsByCustomer = aggregateBookingsPerCustomer(
      (bookingRows ?? []) as BookingRowForCustomerMetrics[]
    );

    const customerRows: CustomerDbRow[] =
      (rows as CustomerDbRow[] | null) ?? [];
    const customers = customerRows.map(row =>
      mapCustomerRowToRecord(row, metricsByCustomer.get(row.id) ?? null)
    );

    return NextResponse.json({
      success: true,
      customers,
      businessName: businessProfile?.business_name ?? null,
      businessBookingLink,
    });
  } catch (e) {
    console.error('customers GET:', e);
    return NextResponse.json(
      { success: false, error: 'Unexpected server error' },
      { status: 500 }
    );
  }
}
