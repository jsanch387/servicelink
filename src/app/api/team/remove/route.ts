import { removeTeamMember } from '@/features/team/server/removeTeamMember';
import { requireOwnedBusiness } from '@/features/team/server/requireOwnedBusiness';
import { TEAM_MEMBER_UI_SOURCES } from '@/features/team/types/teamMemberUi';
import { createSupabaseAdminClient } from '@/libs/supabase/admin';
import { createSupabaseServerClient } from '@/libs/supabase/server';
import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const supabase = await createSupabaseServerClient();
    const owned = await requireOwnedBusiness(supabase);
    if (!owned.ok) {
      return NextResponse.json(
        { success: false, error: owned.error },
        { status: owned.status }
      );
    }

    const body = (await request.json().catch(() => null)) as {
      id?: unknown;
      source?: unknown;
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

    const result = await removeTeamMember(createSupabaseAdminClient(), {
      businessId: owned.businessId,
      id,
      source,
    });

    if (!result.ok) {
      return NextResponse.json(
        { success: false, error: result.error },
        { status: result.status }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('[team] POST /api/team/remove failed', error);
    return NextResponse.json(
      { success: false, error: 'Could not remove team member' },
      { status: 500 }
    );
  }
}
