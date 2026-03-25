import { mapCustomerRowToRecord } from '@/features/customer-management/api/mapCustomerRowToRecord';
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

    const { data: rows, error } = await supabase
      .from('customers')
      .select('*')
      .eq('business_id', resolved.businessId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('customers list error:', error);
      return NextResponse.json(
        { success: false, error: error.message || 'Failed to load customers' },
        { status: 500 }
      );
    }

    const customers = (rows ?? []).map(mapCustomerRowToRecord);

    return NextResponse.json({ success: true, customers });
  } catch (e) {
    console.error('customers GET:', e);
    return NextResponse.json(
      { success: false, error: 'Unexpected server error' },
      { status: 500 }
    );
  }
}
