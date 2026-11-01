import { importCustomersForBusiness } from '@/features/customer-management/server/importCustomers';
import { requireBusinessPermission } from '@/features/team/server/requireBusinessPermission';
import { createSupabaseServerClient } from '@/libs/supabase/server';
import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  try {
    const supabase = await createSupabaseServerClient();
    const resolved = await requireBusinessPermission(
      supabase,
      'customers.write'
    );
    if (!resolved.ok) {
      return NextResponse.json(
        { success: false, error: resolved.error },
        { status: resolved.status }
      );
    }

    const body: unknown = await req.json().catch(() => null);
    const result = await importCustomersForBusiness(
      supabase,
      resolved.businessId,
      body
    );
    if (!result.ok) {
      return NextResponse.json(
        { success: false, error: result.error },
        { status: 400 }
      );
    }

    return NextResponse.json({ success: true, ...result.result });
  } catch (error) {
    console.error('POST /api/customers/import:', error);
    return NextResponse.json(
      { success: false, error: 'Unexpected server error' },
      { status: 500 }
    );
  }
}
