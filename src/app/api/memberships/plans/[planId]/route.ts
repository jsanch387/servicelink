/**
 * PATCH /api/memberships/plans/[planId] — update plan + prices + Stripe sync.
 * DELETE /api/memberships/plans/[planId] — soft-delete (no active subscribers) + archive Stripe catalog.
 * Auth: web cookies or mobile `Authorization: Bearer <access_token>`.
 */

import { deleteMembershipPlanForBusiness } from '@/features/subscriptions/server/deleteMembershipPlan';
import {
  getMembershipsRequestId,
  logMemberships,
  membershipsJsonResponse,
} from '@/features/subscriptions/server/membershipsTransactionLog';
import { parseMembershipPlanWriteBody } from '@/features/subscriptions/server/parseMembershipPlanWriteBody';
import { requireMembershipsPlanWriteAccess } from '@/features/subscriptions/server/requireMembershipsPlanWriteAccess';
import { updateMembershipPlanForBusiness } from '@/features/subscriptions/server/updateMembershipPlan';

interface RouteContext {
  params: Promise<{ planId: string }>;
}

export async function PATCH(req: Request, context: RouteContext) {
  const requestId = getMembershipsRequestId(req);
  try {
    const { planId: rawPlanId } = await context.params;
    const planId = rawPlanId?.trim() ?? '';
    if (!planId) {
      return membershipsJsonResponse(
        requestId,
        { success: false, error: 'Plan id is required.' },
        { status: 400 }
      );
    }

    const raw: unknown = await req.json().catch(() => null);
    const auth = await requireMembershipsPlanWriteAccess(req, {
      bodyForBusinessCheck: raw,
    });
    if (!auth.ok) return auth.response;

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
      planId,
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
  const requestId = getMembershipsRequestId(req);
  try {
    const { planId: rawPlanId } = await context.params;
    const planId = rawPlanId?.trim() ?? '';
    if (!planId) {
      return membershipsJsonResponse(
        requestId,
        { success: false, error: 'Plan id is required.' },
        { status: 400 }
      );
    }

    // Optional JSON body `{ businessId }` for mobile consistency check.
    const raw: unknown = await req.json().catch(() => null);
    const auth = await requireMembershipsPlanWriteAccess(req, {
      bodyForBusinessCheck: raw,
    });
    if (!auth.ok) return auth.response;

    const result = await deleteMembershipPlanForBusiness(
      auth.supabase,
      auth.businessId,
      planId,
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
