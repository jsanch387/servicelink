import { listTeamMembersForOwner } from '@/features/team/server/listTeamMembersForOwner';
import { requireOwnedBusiness } from '@/features/team/server/requireOwnedBusiness';
import { updateTeamMemberName } from '@/features/team/server/updateTeamMemberName';
import { TEAM_MEMBER_UI_SOURCES } from '@/features/team/types/teamMemberUi';
import { getAuthenticatedUser } from '@/libs/api/getAuthenticatedUser';
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

/** Owner updates the shop-facing name on a pending invite or active member. */
export async function PATCH(request: Request) {
  try {
    const auth = await getAuthenticatedUser(request);
    if ('error' in auth) {
      return NextResponse.json(
        { success: false, error: auth.error },
        { status: auth.status }
      );
    }

    const owned = await requireOwnedBusiness(auth.supabase);
    if (!owned.ok) {
      return NextResponse.json(
        { success: false, error: owned.error },
        { status: owned.status }
      );
    }

    const body = (await request.json().catch(() => null)) as {
      id?: unknown;
      source?: unknown;
      name?: unknown;
    } | null;
    const id = typeof body?.id === 'string' ? body.id : '';
    const source =
      typeof body?.source === 'string' &&
      TEAM_MEMBER_UI_SOURCES.includes(
        body.source as (typeof TEAM_MEMBER_UI_SOURCES)[number]
      )
        ? (body.source as (typeof TEAM_MEMBER_UI_SOURCES)[number])
        : null;

    if (!id || !source) {
      return NextResponse.json(
        { success: false, error: 'Member is required' },
        { status: 400 }
      );
    }

    const result = await updateTeamMemberName(createSupabaseAdminClient(), {
      businessId: owned.businessId,
      id,
      source,
      rawName: body?.name,
    });

    if (!result.ok) {
      return NextResponse.json(
        { success: false, error: result.error },
        { status: result.status }
      );
    }

    return NextResponse.json({ success: true, name: result.name });
  } catch (error) {
    console.error('[team] PATCH /api/team/members failed', error);
    return NextResponse.json(
      { success: false, error: 'Could not update name' },
      { status: 500 }
    );
  }
}
