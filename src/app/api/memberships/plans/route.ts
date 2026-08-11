/**
 * POST /api/memberships/plans
 * Owner: create a membership plan + cadence prices.
 */

import { assertMembershipsReady } from '@/features/subscriptions/server/assertMembershipsReady';
import { createMembershipPlanForBusiness } from '@/features/subscriptions/server/createMembershipPlan';
import {
  getMembershipsRequestId,
  logMemberships,
  membershipsJsonResponse,
  shortIdForLog,
} from '@/features/subscriptions/server/membershipsTransactionLog';
import { parseMembershipPlanWriteBody } from '@/features/subscriptions/server/parseMembershipPlanWriteBody';
import { createSupabaseServerClient } from '@/libs/supabase/server';
import { resolveCurrentBusinessId } from '@/server/resolveCurrentBusinessId';

export async function POST(req: Request) {
  const requestId = getMembershipsRequestId(req);
  try {
    const supabase = await createSupabaseServerClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user?.id) {
      return membershipsJsonResponse(
        requestId,
        { success: false, error: 'Authentication required' },
        { status: 401 }
      );
    }

    const resolved = await resolveCurrentBusinessId(supabase);

    if (!resolved.ok) {
      return membershipsJsonResponse(
        requestId,
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
      logMemberships(requestId, 'warn', 'create.gate_blocked', {
        businessId: shortIdForLog(resolved.businessId),
        gate: ready.gate,
      });
      return membershipsJsonResponse(
        requestId,
        { success: false, error: ready.error, gate: ready.gate },
        { status: ready.status }
      );
    }

    const raw: unknown = await req.json().catch(() => null);
    const parsed = parseMembershipPlanWriteBody(raw);
    if (!parsed.ok) {
      return membershipsJsonResponse(
        requestId,
        { success: false, error: parsed.error },
        { status: 400 }
      );
    }

    const result = await createMembershipPlanForBusiness(
      supabase,
      resolved.businessId,
      parsed.value,
      requestId
    );

    if (!result.ok) {
      return membershipsJsonResponse(
        requestId,
        { success: false, error: result.error },
        { status: 400 }
      );
    }

    return membershipsJsonResponse(requestId, {
      success: true,
      plan: result.plan,
    });
  } catch (error) {
    logMemberships(requestId, 'error', 'create.unhandled', {
      reason: error instanceof Error ? error.message.slice(0, 120) : 'unknown',
    });
    return membershipsJsonResponse(
      requestId,
      { success: false, error: 'Failed to create plan' },
      { status: 500 }
    );
  }
}
