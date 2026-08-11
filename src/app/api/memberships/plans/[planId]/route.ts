/**
 * PATCH /api/memberships/plans/[planId] — update plan + prices.
 * DELETE /api/memberships/plans/[planId] — soft-delete (no active subscribers).
 */

import { assertMembershipsReady } from '@/features/subscriptions/server/assertMembershipsReady';
import { deleteMembershipPlanForBusiness } from '@/features/subscriptions/server/deleteMembershipPlan';
import {
  getMembershipsRequestId,
  logMemberships,
  membershipsJsonResponse,
  shortIdForLog,
} from '@/features/subscriptions/server/membershipsTransactionLog';
import { parseMembershipPlanWriteBody } from '@/features/subscriptions/server/parseMembershipPlanWriteBody';
import { updateMembershipPlanForBusiness } from '@/features/subscriptions/server/updateMembershipPlan';
import { createSupabaseServerClient } from '@/libs/supabase/server';
import { resolveCurrentBusinessId } from '@/server/resolveCurrentBusinessId';

interface RouteContext {
  params: Promise<{ planId: string }>;
}

async function requireMembershipsOwner(
  request: Request,
  context: RouteContext
) {
  const requestId = getMembershipsRequestId(request);
  const { planId: rawPlanId } = await context.params;
  const planId = rawPlanId?.trim() ?? '';
  if (!planId) {
    return {
      ok: false as const,
      requestId,
      response: membershipsJsonResponse(
        requestId,
        { success: false, error: 'Plan id is required.' },
        { status: 400 }
      ),
    };
  }

  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user?.id) {
    return {
      ok: false as const,
      requestId,
      response: membershipsJsonResponse(
        requestId,
        { success: false, error: 'Authentication required' },
        { status: 401 }
      ),
    };
  }

  const resolved = await resolveCurrentBusinessId(supabase);
  if (!resolved.ok) {
    return {
      ok: false as const,
      requestId,
      response: membershipsJsonResponse(
        requestId,
        { success: false, error: resolved.error },
        { status: resolved.status }
      ),
    };
  }

  const ready = await assertMembershipsReady(
    supabase,
    user.id,
    resolved.businessId,
    user.email
  );
  if (!ready.ok) {
    logMemberships(requestId, 'warn', 'write.gate_blocked', {
      businessId: shortIdForLog(resolved.businessId),
      planId: shortIdForLog(planId),
      gate: ready.gate,
    });
    return {
      ok: false as const,
      requestId,
      response: membershipsJsonResponse(
        requestId,
        { success: false, error: ready.error, gate: ready.gate },
        { status: ready.status }
      ),
    };
  }

  return {
    ok: true as const,
    requestId,
    supabase,
    businessId: resolved.businessId,
    planId,
  };
}

export async function PATCH(req: Request, context: RouteContext) {
  const auth = await requireMembershipsOwner(req, context);
  try {
    if (!auth.ok) return auth.response;

    const raw: unknown = await req.json().catch(() => null);
    const parsed = parseMembershipPlanWriteBody(raw);
    if (!parsed.ok) {
      return membershipsJsonResponse(
        auth.requestId,
        { success: false, error: parsed.error },
        { status: 400 }
      );
    }

    const result = await updateMembershipPlanForBusiness(
      auth.supabase,
      auth.businessId,
      auth.planId,
      parsed.value,
      auth.requestId
    );

    if (!result.ok) {
      const status = result.error === 'Plan not found.' ? 404 : 400;
      return membershipsJsonResponse(
        auth.requestId,
        { success: false, error: result.error },
        { status }
      );
    }

    return membershipsJsonResponse(auth.requestId, {
      success: true,
      plan: result.plan,
    });
  } catch (error) {
    const requestId =
      auth && 'requestId' in auth
        ? auth.requestId
        : getMembershipsRequestId(req);
    logMemberships(requestId, 'error', 'update.unhandled', {
      reason: error instanceof Error ? error.message.slice(0, 120) : 'unknown',
    });
    return membershipsJsonResponse(
      requestId,
      { success: false, error: 'Failed to update plan' },
      { status: 500 }
    );
  }
}

export async function DELETE(req: Request, context: RouteContext) {
  const auth = await requireMembershipsOwner(req, context);
  try {
    if (!auth.ok) return auth.response;

    const result = await deleteMembershipPlanForBusiness(
      auth.supabase,
      auth.businessId,
      auth.planId,
      auth.requestId
    );

    if (!result.ok) {
      const status =
        result.code === 'not_found'
          ? 404
          : result.code === 'has_subscribers'
            ? 409
            : 400;
      return membershipsJsonResponse(
        auth.requestId,
        { success: false, error: result.error, code: result.code },
        { status }
      );
    }

    return membershipsJsonResponse(auth.requestId, {
      success: true,
      activeSubscriberCount: result.activeSubscriberCount,
    });
  } catch (error) {
    const requestId =
      auth && 'requestId' in auth
        ? auth.requestId
        : getMembershipsRequestId(req);
    logMemberships(requestId, 'error', 'delete.unhandled', {
      reason: error instanceof Error ? error.message.slice(0, 120) : 'unknown',
    });
    return membershipsJsonResponse(
      requestId,
      { success: false, error: 'Failed to delete plan' },
      { status: 500 }
    );
  }
}
