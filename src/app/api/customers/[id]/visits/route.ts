import {
  CUSTOMER_SERVICE_HISTORY_LIMIT,
  mapCompletedCustomerVisits,
} from '@/features/customer-management/server/mapCompletedCustomerVisits';
import { requireBusinessPermission } from '@/features/team/server/requireBusinessPermission';
import { getAuthenticatedUser } from '@/libs/api/getAuthenticatedUser';
import { NextResponse } from 'next/server';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await getAuthenticatedUser(request);
    if ('error' in auth) {
      return NextResponse.json(
        { success: false, error: auth.error, code: auth.code },
        { status: auth.status }
      );
    }

    const { supabase } = auth;
    const resolved = await requireBusinessPermission(
      supabase,
      'customers.read'
    );

    if (!resolved.ok) {
      return NextResponse.json(
        { success: false, error: resolved.error },
        { status: resolved.status }
      );
    }

    const { id } = await params;
    const customerId = id.trim();
    if (!customerId) {
      return NextResponse.json(
        { success: false, error: 'Customer not found' },
        { status: 404 }
      );
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const db = supabase as any;
    const { data: customer, error: customerError } = await db
      .from('customers')
      .select('id')
      .eq('id', customerId)
      .eq('business_id', resolved.businessId)
      .maybeSingle();

    if (customerError) {
      console.error('customer visits lookup error:', customerError);
      return NextResponse.json(
        { success: false, error: 'Failed to load customer' },
        { status: 500 }
      );
    }

    if (!customer) {
      return NextResponse.json(
        { success: false, error: 'Customer not found' },
        { status: 404 }
      );
    }

    const { data: bookingRows, error: bookingError } = await db
      .from('bookings')
      .select(
        'id, service_name, service_price_cents, addon_details, job_details, scheduled_date, start_time, status'
      )
      .eq('business_id', resolved.businessId)
      .eq('customer_id', customerId)
      .eq('status', 'completed')
      .order('scheduled_date', { ascending: false })
      .order('start_time', { ascending: false })
      .order('id', { ascending: false })
      .limit(CUSTOMER_SERVICE_HISTORY_LIMIT);

    if (bookingError) {
      console.error('customer visits bookings error:', bookingError);
      return NextResponse.json(
        { success: false, error: 'Failed to load visits' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      visits: mapCompletedCustomerVisits(bookingRows ?? []),
    });
  } catch (error) {
    console.error('GET /api/customers/[id]/visits:', error);
    return NextResponse.json(
      { success: false, error: 'Unexpected server error' },
      { status: 500 }
    );
  }
}
