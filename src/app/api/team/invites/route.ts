import { getAppBaseUrl } from '@/features/email/services/resendClient';
import { createTeamInvite } from '@/features/team/server/createTeamInvite';
import { requireOwnedBusiness } from '@/features/team/server/requireOwnedBusiness';
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
      email?: unknown;
    } | null;
    const rawEmail = typeof body?.email === 'string' ? body.email : '';

    const {
      data: { user },
    } = await supabase.auth.getUser();

    const admin = createSupabaseAdminClient();
    const { data: shop } = await admin
      .from('business_profiles')
      .select('business_name')
      .eq('id', owned.businessId)
      .maybeSingle();
    const shopName =
      (
        shop as { business_name?: string | null } | null
      )?.business_name?.trim() || 'this shop';

    const result = await createTeamInvite(admin, {
      businessId: owned.businessId,
      invitedBy: owned.userId,
      ownerEmail: user?.email ?? null,
      businessName: shopName,
      rawEmail,
      inviteBaseUrl: getAppBaseUrl(request),
    });

    if (!result.ok) {
      return NextResponse.json(
        { success: false, error: result.error },
        { status: result.status }
      );
    }

    return NextResponse.json({ success: true, member: result.member });
  } catch (error) {
    console.error('[team] POST /api/team/invites failed', error);
    return NextResponse.json(
      { success: false, error: 'Could not send invite' },
      { status: 500 }
    );
  }
}
