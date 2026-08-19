/**
 * GET /api/memberships/subscribers
 * Owner: list customer memberships for the current business.
 *
 * Auth: `getAuthenticatedUser` (mobile Bearer or web cookie).
 */

import { listOwnerCustomerMemberships } from '@/features/subscriptions/server/listOwnerCustomerMemberships';
import {
  getMembershipsRequestId,
  membershipsJsonResponse,
} from '@/features/subscriptions/server/membershipsTransactionLog';
import { requireOwnerMembershipsSubscriberAccess } from '@/features/subscriptions/server/requireOwnerMembershipsSubscriberAccess';

export async function GET(req: Request) {
  const requestId = getMembershipsRequestId(req);
  try {
    const ctx = await requireOwnerMembershipsSubscriberAccess(req);
    if (!ctx.ok) return ctx.response;

    const url = new URL(req.url);
    const planId = url.searchParams.get('planId');
    const result = await listOwnerCustomerMemberships(
      ctx.supabase,
      ctx.businessId,
      { planId }
    );

    if (!result.ok) {
      return membershipsJsonResponse(
        ctx.requestId,
        { success: false, error: result.error },
        { status: 500 }
      );
    }

    return membershipsJsonResponse(ctx.requestId, {
      success: true,
      subscribers: result.subscribers,
    });
  } catch {
    return membershipsJsonResponse(
      requestId,
      { success: false, error: 'Something went wrong' },
      { status: 500 }
    );
  }
}
