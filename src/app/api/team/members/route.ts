import { listTeamMembersForOwner } from '@/features/team/server/listTeamMembersForOwner';
import { requireOwnedBusiness } from '@/features/team/server/requireOwnedBusiness';
import { createSupabaseAdminClient } from '@/libs/supabase/admin';
import { createSupabaseServerClient } from '@/libs/supabase/server';
import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const supabase = await createSupabaseServerClient();
    const owned = await requireOwnedBusiness(supabase);
    if (!owned.ok) {
      return NextResponse.json(
        { success: false, error: owned.error },
        { status: owned.status }
      );
    }

    const admin = createSupabaseAdminClient();
    const members = await listTeamMembersForOwner(admin, owned.businessId);
    return NextResponse.json({ success: true, members });
  } catch (error) {
    console.error('[team] GET /api/team/members failed', error);
    return NextResponse.json(
      { success: false, error: 'Could not load team' },
      { status: 500 }
    );
  }
}
