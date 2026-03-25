import { mapCustomerRowToRecord } from '@/features/customer-management/api/mapCustomerRowToRecord';
import type { CustomerDbRow } from '@/features/customer-management/api/customerDbRow';
import {
  aggregateBookingsPerCustomer,
  type BookingRowForCustomerMetrics,
} from '@/features/customer-management/server/aggregateBookingsPerCustomer';
import { resolveCurrentBusinessId } from '@/features/customer-management/server/resolveCurrentBusinessId';
import { createSupabaseServerClient } from '@/libs/supabase/server';
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

    return NextResponse.json({ success: true, customers });
  } catch (e) {
    console.error('customers GET:', e);
    return NextResponse.json(
      { success: false, error: 'Unexpected server error' },
      { status: 500 }
    );
  }
}
