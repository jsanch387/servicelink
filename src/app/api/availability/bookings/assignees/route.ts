import { listAssignableShopUsers } from '@/features/team/server/listAssignableShopUsers';
import { requireBusinessPermission } from '@/features/team/server/requireBusinessPermission';
import { getAuthenticatedUser } from '@/libs/api/getAuthenticatedUser';
import { createSupabaseAdminClient } from '@/libs/supabase/admin';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    const auth = await getAuthenticatedUser(request);
    if ('error' in auth) {
      return NextResponse.json(
        { success: false, error: auth.error },
        { status: auth.status }
      );
    }

    const resolved = await requireBusinessPermission(
      auth.supabase,
      'bookings.read'
    );
    if (!resolved.ok) {
      return NextResponse.json(
        { success: false, error: resolved.error },
        { status: resolved.status }
      );
    }

    const admin = createSupabaseAdminClient();
    const assignees = await listAssignableShopUsers(admin, resolved.businessId);
    return NextResponse.json({ success: true, assignees });
  } catch (error) {
    console.error('[team] GET /api/availability/bookings/assignees', error);
    return NextResponse.json(
      { success: false, error: 'Could not load assignees' },
      { status: 500 }
    );
  }
}
