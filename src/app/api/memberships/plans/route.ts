/**
 * POST /api/memberships/plans
 * Owner: create a membership plan + cadence prices + Stripe Connect catalog sync.
 * Auth: web cookies or mobile `Authorization: Bearer <access_token>`.
 */

import { createMembershipPlanForBusiness } from '@/features/subscriptions/server/createMembershipPlan';
import {
  getMembershipsRequestId,
  logMemberships,
  membershipsJsonResponse,
} from '@/features/subscriptions/server/membershipsTransactionLog';
import { parseMembershipPlanWriteBody } from '@/features/subscriptions/server/parseMembershipPlanWriteBody';
import { requireMembershipsPlanWriteAccess } from '@/features/subscriptions/server/requireMembershipsPlanWriteAccess';

export async function POST(req: Request) {
  const requestId = getMembershipsRequestId(req);
  try {
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

    const result = await createMembershipPlanForBusiness(
      auth.supabase,
      auth.businessId,
      parsed.value,
      auth.requestId
    );

    if (!result.ok) {
      return membershipsJsonResponse(
        auth.requestId,
        { success: false, error: result.error },
        { status: 400 }
      );
    }

    return membershipsJsonResponse(auth.requestId, {
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
