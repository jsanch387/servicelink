/**
 * GET  /api/memberships/subscribers/:id
 * POST /api/memberships/subscribers/:id
 *   { action: 'cancel_at_period_end' | 'cancel_now' | 'portal_link' | 'portal_session' | 'save_notes' | 'send_schedule_link' }
 *
 * Auth: `getAuthenticatedUser` (mobile Bearer or web cookie).
 */

import { API_ROUTES } from '@/constants/routes';
import { cancelOwnerCustomerMembership } from '@/features/subscriptions/server/cancelOwnerCustomerMembership';
import { createMembershipBillingPortalSession } from '@/features/subscriptions/server/createMembershipBillingPortalSession';
import { getOwnerCustomerMembership } from '@/features/subscriptions/server/listOwnerCustomerMemberships';
import { signMembershipManageToken } from '@/features/subscriptions/server/membershipManageToken';
import {
  getMembershipsRequestId,
  membershipsJsonResponse,
} from '@/features/subscriptions/server/membershipsTransactionLog';
import { requireOwnerMembershipsSubscriberAccess } from '@/features/subscriptions/server/requireOwnerMembershipsSubscriberAccess';
import { sendOwnerMembershipScheduleLink } from '@/features/subscriptions/server/sendOwnerMembershipScheduleLink';
import { updateOwnerMembershipNotes } from '@/features/subscriptions/server/updateOwnerMembershipNotes';
import { getAppBaseUrl } from '@/libs/stripe';
import { assertOwnerMembershipScheduleLinkRateLimits } from '@/server/rateLimit/ownerMembershipScheduleLinkRateLimit';
import type { NextRequest } from 'next/server';

type RouteContext = { params: Promise<{ subscriberId: string }> };

export async function GET(req: Request, context: RouteContext) {
  try {
    const { subscriberId } = await context.params;
    const ctx = await requireOwnerMembershipsSubscriberAccess(req);
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
    const ctx = await requireOwnerMembershipsSubscriberAccess(req);
    if (!ctx.ok) return ctx.response;

    const body = (await req.json().catch(() => ({}))) as {
      action?: unknown;
      notes?: unknown;
    };
    const action = typeof body.action === 'string' ? body.action.trim() : '';

    if (action === 'save_notes') {
      const notes = typeof body.notes === 'string' ? body.notes : '';
      const result = await updateOwnerMembershipNotes(ctx.supabase, {
        businessId: ctx.businessId,
        membershipId: subscriberId,
        notes,
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

    if (action === 'send_schedule_link') {
      const rateLimit = await assertOwnerMembershipScheduleLinkRateLimits(
        req as NextRequest,
        ctx.userId
      );
      if (!rateLimit.ok) {
        return membershipsJsonResponse(
          ctx.requestId,
          {
            success: false,
            error: 'Too many schedule links sent. Try again later.',
          },
          {
            status: 429,
            headers: { 'Retry-After': String(rateLimit.retryAfterSec) },
          }
        );
      }

      const result = await sendOwnerMembershipScheduleLink(ctx.supabase, {
        businessId: ctx.businessId,
        membershipId: subscriberId,
        request: req,
      });
      if (!result.ok) {
        return membershipsJsonResponse(
          ctx.requestId,
          { success: false, error: result.error },
          {
            status: result.status,
            headers:
              result.retryAfterSec != null
                ? { 'Retry-After': String(result.retryAfterSec) }
                : undefined,
          }
        );
      }
      return membershipsJsonResponse(ctx.requestId, {
        success: true,
        emailed: result.emailed,
        smsed: result.smsed,
        scheduleUrl: result.scheduleUrl,
      });
    }

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
        alreadyCanceled: result.alreadyCanceled === true,
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
