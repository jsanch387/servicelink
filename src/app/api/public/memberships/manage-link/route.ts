/**
 * POST /api/public/memberships/manage-link
 * Body: { businessSlug, email }
 *
 * Always returns a generic success for valid input (anti-enumeration).
 * When a manageable membership matches, emails a signed manage/cancel link.
 */

import { requestPublicMembershipManageLink } from '@/features/subscriptions/server/requestPublicMembershipManageLink';
import {
  getMembershipsRequestId,
  logMemberships,
  membershipsJsonResponse,
} from '@/features/subscriptions/server/membershipsTransactionLog';
import { assertPublicMembershipManageLinkRateLimits } from '@/server/rateLimit/publicApiRateLimit';
import { NextRequest } from 'next/server';

export async function POST(req: NextRequest) {
  const requestId = getMembershipsRequestId(req);
  try {
    const raw: unknown = await req.json().catch(() => null);
    const body =
      raw && typeof raw === 'object'
        ? (raw as { businessSlug?: unknown; email?: unknown })
        : null;

    const businessSlug =
      typeof body?.businessSlug === 'string' ? body.businessSlug : '';
    const email = typeof body?.email === 'string' ? body.email : '';

    const rateLimited = await assertPublicMembershipManageLinkRateLimits(
      req,
      businessSlug || 'missing',
      email || 'missing'
    );
    if (rateLimited) return rateLimited;

    const result = await requestPublicMembershipManageLink(
      req,
      { businessSlug, email },
      requestId
    );

    if (!result.ok) {
      return membershipsJsonResponse(
        requestId,
        { success: false, error: result.error },
        { status: result.status }
      );
    }

    return membershipsJsonResponse(requestId, {
      success: true,
      message:
        'If we find a subscription for that email, we’ll send a manage link shortly.',
    });
  } catch (error) {
    logMemberships(requestId, 'error', 'manage_link.unhandled', {
      reason: error instanceof Error ? error.message.slice(0, 120) : 'unknown',
    });
    return membershipsJsonResponse(
      requestId,
      {
        success: true,
        message:
          'If we find a subscription for that email, we’ll send a manage link shortly.',
      },
      { status: 200 }
    );
  }
}
