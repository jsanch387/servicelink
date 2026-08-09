/**
 * POST /api/memberships/plans
 * Owner: create a membership plan + cadence prices.
 */

import { assertMembershipsReady } from '@/features/subscriptions/server/assertMembershipsReady';
import { createMembershipPlanForBusiness } from '@/features/subscriptions/server/createMembershipPlan';
import { parseMembershipPlanWriteBody } from '@/features/subscriptions/server/parseMembershipPlanWriteBody';
import { createSupabaseServerClient } from '@/libs/supabase/server';
import { resolveCurrentBusinessId } from '@/server/resolveCurrentBusinessId';
import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  try {
    const supabase = await createSupabaseServerClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user?.id) {
      return NextResponse.json(
        { success: false, error: 'Authentication required' },
        { status: 401 }
      );
    }

    const resolved = await resolveCurrentBusinessId(supabase);

    if (!resolved.ok) {
      return NextResponse.json(
        { success: false, error: resolved.error },
        { status: resolved.status }
      );
    }

    const ready = await assertMembershipsReady(
      supabase,
      user.id,
      resolved.businessId,
      user.email
    );
    if (!ready.ok) {
      return NextResponse.json(
        { success: false, error: ready.error, gate: ready.gate },
        { status: ready.status }
      );
    }

    const raw: unknown = await req.json().catch(() => null);
    const parsed = parseMembershipPlanWriteBody(raw);
    if (!parsed.ok) {
      return NextResponse.json(
        { success: false, error: parsed.error },
        { status: 400 }
      );
    }

    const result = await createMembershipPlanForBusiness(
      supabase,
      resolved.businessId,
      parsed.value
    );

    if (!result.ok) {
      return NextResponse.json(
        { success: false, error: result.error },
        { status: 400 }
      );
    }

    return NextResponse.json({ success: true, plan: result.plan });
  } catch (error) {
    console.error('[memberships/plans POST]', error);
    return NextResponse.json(
      { success: false, error: 'Failed to create plan' },
      { status: 500 }
    );
  }
}
