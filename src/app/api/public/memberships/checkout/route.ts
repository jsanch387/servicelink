/**
 * POST /api/public/memberships/checkout
 *
 * Creates a Stripe Checkout Session (`mode: 'subscription'`) on the business’s
 * connected Express account for a published membership plan price.
 *
 * Webhooks / member rows / emails: not handled here yet.
 */

import { createPublicMembershipCheckoutSession } from '@/features/subscriptions/server/createPublicMembershipCheckoutSession';
import {
  getMembershipsRequestId,
  logMemberships,
  membershipsJsonResponse,
} from '@/features/subscriptions/server/membershipsTransactionLog';
import { assertPublicMembershipCheckoutRateLimits } from '@/server/rateLimit/publicApiRateLimit';
import { NextRequest } from 'next/server';

export async function POST(req: NextRequest) {
  const requestId = getMembershipsRequestId(req);
  try {
    const raw: unknown = await req.json().catch(() => null);
    const body =
      raw && typeof raw === 'object'
        ? (raw as {
            businessSlug?: unknown;
            planId?: unknown;
            priceId?: unknown;
          })
        : null;

    const businessSlug =
      typeof body?.businessSlug === 'string' ? body.businessSlug : '';
    const planId = typeof body?.planId === 'string' ? body.planId : '';
    const priceId = typeof body?.priceId === 'string' ? body.priceId : '';

    const rateLimited = await assertPublicMembershipCheckoutRateLimits(
      req,
      businessSlug || 'missing'
    );
    if (rateLimited) return rateLimited;

    const result = await createPublicMembershipCheckoutSession(
      req,
      { businessSlug, planId, priceId },
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
      url: result.url,
      sessionId: result.sessionId,
    });
  } catch (error) {
    logMemberships(requestId, 'error', 'checkout.unhandled', {
      reason: error instanceof Error ? error.message.slice(0, 120) : 'unknown',
    });
    return membershipsJsonResponse(
      requestId,
      { success: false, error: 'Could not start checkout.' },
      { status: 500 }
    );
  }
}
