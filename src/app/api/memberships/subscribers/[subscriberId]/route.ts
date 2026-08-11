/**
 * GET  /api/memberships/subscribers/:id
 * POST /api/memberships/subscribers/:id
 *   { action: 'cancel_at_period_end' | 'cancel_now' | 'portal_link' | 'portal_session' }
 */

import { API_ROUTES } from '@/constants/routes';
import { assertMembershipsReady } from '@/features/subscriptions/server/assertMembershipsReady';
import { cancelOwnerCustomerMembership } from '@/features/subscriptions/server/cancelOwnerCustomerMembership';
import { createMembershipBillingPortalSession } from '@/features/subscriptions/server/createMembershipBillingPortalSession';
import { getOwnerCustomerMembership } from '@/features/subscriptions/server/listOwnerCustomerMemberships';
import { signMembershipManageToken } from '@/features/subscriptions/server/membershipManageToken';
import {
  getMembershipsRequestId,
  membershipsJsonResponse,
} from '@/features/subscriptions/server/membershipsTransactionLog';
import { getAppBaseUrl } from '@/libs/stripe';
import { createSupabaseServerClient } from '@/libs/supabase/server';
import { resolveCurrentBusinessId } from '@/server/resolveCurrentBusinessId';

type RouteContext = { params: Promise<{ subscriberId: string }> };

async function requireOwnerMembershipsContext(req: Request) {
  const requestId = getMembershipsRequestId(req);
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
  };
}

export async function GET(req: Request, context: RouteContext) {
  try {
    const { subscriberId } = await context.params;
    const ctx = await requireOwnerMembershipsContext(req);
    if (!ctx.ok) return ctx.response;

    const result = await getOwnerCustomerMembership(
      ctx.supabase,
      ctx.businessId,
      subscriberId
    );
    if (!result.ok) {
      return membershipsJsonResponse(
        ctx.requestId,
        { success: false, error: result.error },
        { status: result.status }
      );
    }

    return membershipsJsonResponse(ctx.requestId, {
      success: true,
      subscriber: result.subscriber,
    });
  } catch {
    const requestId = getMembershipsRequestId(req);
    return membershipsJsonResponse(
      requestId,
      { success: false, error: 'Something went wrong' },
      { status: 500 }
    );
  }
}

export async function POST(req: Request, context: RouteContext) {
  try {
    const { subscriberId } = await context.params;
    const ctx = await requireOwnerMembershipsContext(req);
    if (!ctx.ok) return ctx.response;

    const body = (await req.json().catch(() => ({}))) as {
      action?: unknown;
    };
    const action = typeof body.action === 'string' ? body.action.trim() : '';

    if (action === 'portal_link') {
      const token = signMembershipManageToken(subscriberId);
      const baseUrl = getAppBaseUrl(req);
      const manageUrl = `${baseUrl}${API_ROUTES.PUBLIC_MEMBERSHIPS_PORTAL}?token=${encodeURIComponent(token)}`;
      return membershipsJsonResponse(ctx.requestId, {
        success: true,
        manageUrl,
      });
    }

    if (action === 'portal_session') {
      const portal = await createMembershipBillingPortalSession(ctx.supabase, {
        membershipId: subscriberId,
        request: req,
      });
      if (!portal.ok) {
        return membershipsJsonResponse(
          ctx.requestId,
          { success: false, error: portal.error },
          { status: portal.status }
        );
      }
      return membershipsJsonResponse(ctx.requestId, {
        success: true,
        url: portal.url,
      });
    }

    if (action === 'cancel_at_period_end' || action === 'cancel_now') {
      const result = await cancelOwnerCustomerMembership(ctx.supabase, {
        businessId: ctx.businessId,
        membershipId: subscriberId,
        mode: action === 'cancel_now' ? 'immediate' : 'at_period_end',
      });
      if (!result.ok) {
        return membershipsJsonResponse(
          ctx.requestId,
          { success: false, error: result.error },
          { status: result.status }
        );
      }
      return membershipsJsonResponse(ctx.requestId, {
        success: true,
        subscriber: result.subscriber,
      });
    }

    return membershipsJsonResponse(
      ctx.requestId,
      { success: false, error: 'Unknown action.' },
      { status: 400 }
    );
  } catch {
    const requestId = getMembershipsRequestId(req);
    return membershipsJsonResponse(
      requestId,
      { success: false, error: 'Something went wrong' },
      { status: 500 }
    );
  }
}
