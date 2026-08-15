/**
 * POST /api/public/memberships/checkout
 *
 * Creates a Stripe Checkout Session (`mode: 'subscription'`) on the business’s
 * connected Express account for a published membership plan price.
 * Requires a first-visit date/time (validated against the calendar).
 * Connect webhook upserts the member and creates the calendar booking.
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
            firstVisitDate?: unknown;
            firstVisitTime?: unknown;
            street?: unknown;
            unit?: unknown;
            city?: unknown;
            state?: unknown;
            zip?: unknown;
            vehicleYear?: unknown;
            vehicleMake?: unknown;
            vehicleModel?: unknown;
          })
        : null;

    const str = (v: unknown) => (typeof v === 'string' ? v : '');
    const businessSlug = str(body?.businessSlug);
    const planId = str(body?.planId);
    const priceId = str(body?.priceId);
    const firstVisitDate = str(body?.firstVisitDate);
    const firstVisitTime = str(body?.firstVisitTime);

    const rateLimited = await assertPublicMembershipCheckoutRateLimits(
      req,
      businessSlug || 'missing'
    );
    if (rateLimited) return rateLimited;

    const result = await createPublicMembershipCheckoutSession(
      req,
      {
        businessSlug,
        planId,
        priceId,
        firstVisitDate,
        firstVisitTime,
        street: str(body?.street),
        unit: str(body?.unit),
        city: str(body?.city),
        state: str(body?.state),
        zip: str(body?.zip),
        vehicleYear: str(body?.vehicleYear),
        vehicleMake: str(body?.vehicleMake),
        vehicleModel: str(body?.vehicleModel),
      },
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
