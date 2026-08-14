/**
 * POST /api/public/memberships/visit
 *
 * Member books the current-period visit via signed token
 * (`/{slug}/membership/visit?token=`).
 */

import { createPublicMembershipPeriodVisit } from '@/features/subscriptions/server/createPublicMembershipPeriodVisit';
import {
  getMembershipsRequestId,
  logMemberships,
  membershipsJsonResponse,
} from '@/features/subscriptions/server/membershipsTransactionLog';
import { createSupabaseAdminClient } from '@/libs/supabase/admin';
import { assertPublicMembershipVisitRateLimits } from '@/server/rateLimit/publicApiRateLimit';
import { NextRequest } from 'next/server';

export async function POST(req: NextRequest) {
  const requestId = getMembershipsRequestId(req);
  try {
    const raw: unknown = await req.json().catch(() => null);
    const body =
      raw && typeof raw === 'object'
        ? (raw as {
            token?: unknown;
            businessSlug?: unknown;
            visitDate?: unknown;
            visitTime?: unknown;
            street?: unknown;
            unit?: unknown;
            city?: unknown;
            state?: unknown;
            zip?: unknown;
          })
        : null;

    const str = (v: unknown) => (typeof v === 'string' ? v : '');
    const token = str(body?.token);
    const businessSlug = str(body?.businessSlug);
    const visitDate = str(body?.visitDate);
    const visitTime = str(body?.visitTime);

    const rateLimited = await assertPublicMembershipVisitRateLimits(
      req,
      businessSlug || 'missing'
    );
    if (rateLimited) return rateLimited;

    const supabase = createSupabaseAdminClient();
    const result = await createPublicMembershipPeriodVisit(supabase, {
      token,
      businessSlug,
      visitDate,
      visitTime,
      address: {
        street: str(body?.street),
        unit: str(body?.unit),
        city: str(body?.city),
        state: str(body?.state),
        zip: str(body?.zip),
      },
      requestId,
    });

    if (!result.ok) {
      logMemberships(requestId, 'warn', 'period_visit.public_rejected', {
        code: result.code,
        status: result.status,
      });
      return membershipsJsonResponse(
        requestId,
        { success: false, error: result.error, code: result.code },
        { status: result.status }
      );
    }

    return membershipsJsonResponse(requestId, {
      success: true,
      bookingId: result.bookingId,
      scheduledDate: result.scheduledDate,
      startTime: result.startTime,
    });
  } catch (err) {
    logMemberships(requestId, 'error', 'period_visit.public_unexpected', {
      error: err instanceof Error ? err.message : 'unknown',
    });
    return membershipsJsonResponse(
      requestId,
      { success: false, error: 'Something went wrong. Try again.' },
      { status: 500 }
    );
  }
}
