/**
 * POST /api/team/invites
 *
 * Owner sends or resends a team invite email. The hire accepts on web
 * (`/team/invite/<token>`). Mobile and the dashboard share this route.
 *
 * Auth: `getAuthenticatedUser` (mobile Bearer or web cookie).
 * Shop: owned `business_profiles` only (`team.manage`). Members get 403.
 */

import { getAppBaseUrl } from '@/features/email/services/resendClient';
import { createTeamInvite } from '@/features/team/server/createTeamInvite';
import { requireOwnedBusiness } from '@/features/team/server/requireOwnedBusiness';
import { getAuthenticatedUser } from '@/libs/api/getAuthenticatedUser';
import { createSupabaseAdminClient } from '@/libs/supabase/admin';
import { NextResponse } from 'next/server';

function errorJson(error: string, status: number) {
  return NextResponse.json({ error }, { status });
}

export async function POST(request: Request) {
  try {
    const auth = await getAuthenticatedUser(request);
    if ('error' in auth) {
      return errorJson(auth.error, auth.status);
    }

    const owned = await requireOwnedBusiness(auth.supabase);
    if (!owned.ok) {
      return errorJson(owned.error, owned.status);
    }

    const body = (await request.json().catch(() => null)) as {
      email?: unknown;
    } | null;
    const rawEmail = typeof body?.email === 'string' ? body.email : '';

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
      ownerEmail: auth.user.email ?? null,
      businessName: shopName,
      rawEmail,
      inviteBaseUrl: getAppBaseUrl(),
    });

    if (!result.ok) {
      return errorJson(result.error, result.status);
    }

    return NextResponse.json(
      result.resent ? { ok: true, resent: true } : { ok: true },
      { status: result.resent ? 200 : 201 }
    );
  } catch (error) {
    console.error('[team] POST /api/team/invites failed', error);
    return errorJson('Could not send invite', 500);
  }
}
