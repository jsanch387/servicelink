import { CUSTOMER_ASSET_TYPE_VEHICLE } from '@/features/customer-management/utils/customerAssetTypes';
import { requireBusinessPermission } from '@/features/team/server/requireBusinessPermission';
import { getAuthenticatedUser } from '@/libs/api/getAuthenticatedUser';
import { NextResponse } from 'next/server';

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string; vehicleId: string }> }
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
      'customers.write'
    );
    if (!resolved.ok) {
      return NextResponse.json(
        { success: false, error: resolved.error },
        { status: resolved.status }
      );
    }

    const { id, vehicleId: rawVehicleId } = await params;
    const customerId = id.trim();
    const vehicleId = rawVehicleId.trim();
    if (!customerId || !vehicleId) {
      return NextResponse.json(
        { success: false, error: 'Vehicle not found' },
        { status: 404 }
      );
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const db = supabase as any;
    const { data, error } = await db
      .from('customer_assets')
      .delete()
      .eq('id', vehicleId)
      .eq('customer_id', customerId)
      .eq('business_id', resolved.businessId)
      .eq('asset_type', CUSTOMER_ASSET_TYPE_VEHICLE)
      .select('id')
      .maybeSingle();

    if (error) {
      console.error('customer vehicle delete error:', error);
      return NextResponse.json(
        { success: false, error: 'Failed to remove vehicle' },
        { status: 500 }
      );
    }

    if (!data) {
      return NextResponse.json(
        { success: false, error: 'Vehicle not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('DELETE /api/customers/[id]/vehicles/[vehicleId]:', error);
    return NextResponse.json(
      { success: false, error: 'Unexpected server error' },
      { status: 500 }
    );
  }
}
