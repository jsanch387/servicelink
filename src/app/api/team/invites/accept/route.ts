import { acceptTeamInvite } from '@/features/team/server/acceptTeamInvite';
import { createSupabaseAdminClient } from '@/libs/supabase/admin';
import { createSupabaseServerClient } from '@/libs/supabase/server';
import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const supabase = await createSupabaseServerClient();
    const {
      data: { user },
      error,
    } = await supabase.auth.getUser();

    if (error || !user) {
      return NextResponse.json(
        { success: false, error: 'Sign in to accept this invite' },
        { status: 401 }
      );
    }

    const body = (await request.json().catch(() => null)) as {
      token?: unknown;
    } | null;
    const token = typeof body?.token === 'string' ? body.token : '';

    const result = await acceptTeamInvite(createSupabaseAdminClient(), {
      rawToken: token,
      userId: user.id,
      userEmail: user.email ?? null,
    });

    if (!result.ok) {
      return NextResponse.json(
        { success: false, error: result.error },
        { status: result.status }
      );
    }

    return NextResponse.json({
      success: true,
      businessName: result.businessName,
    });
  } catch (error) {
    console.error('[team] POST /api/team/invites/accept failed', error);
    return NextResponse.json(
      { success: false, error: 'Could not accept invite' },
      { status: 500 }
    );
  }
}
