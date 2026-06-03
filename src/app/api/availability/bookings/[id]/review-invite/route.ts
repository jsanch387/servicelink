/**
 * POST /api/availability/bookings/[id]/review-invite
 *
 * Owner-only: create review invite + send email for a completed booking.
 * Used by mobile after updating booking status directly in Supabase.
 * Web PATCH complete already runs the same logic inline.
 */

import { requestReviewInviteForBooking } from '@/features/reviews/server/requestReviewInviteForBooking';
import {
  buildReviewInviteTrace,
  getReviewInviteRequestId,
  logReviewInviteFinished,
  reviewInviteJsonResponse,
} from '@/features/reviews/server/reviewInviteRouteLog';
import { getAuthenticatedUser } from '@/libs/api/getAuthenticatedUser';
import { resolveCurrentBusinessId } from '@/server/resolveCurrentBusinessId';
import { NextRequest } from 'next/server';

interface RouteContext {
  params: Promise<{ id: string }>;
}

export async function POST(request: NextRequest, { params }: RouteContext) {
  const requestId = getReviewInviteRequestId(request);

  try {
    const { id } = await params;
    const bookingId = id?.trim();
    if (!bookingId) {
      const trace = buildReviewInviteTrace(requestId, 'mobile_api');
      logReviewInviteFinished(trace, {
        kind: 'rejected',
        httpStatus: 400,
        error: 'Booking ID required',
      });
      return reviewInviteJsonResponse(
        requestId,
        { success: false, error: 'Booking ID required' },
        400
      );
    }

    const auth = await getAuthenticatedUser(request);
    if ('error' in auth) {
      logReviewInviteFinished(
        buildReviewInviteTrace(requestId, 'mobile_api', { bookingId }),
        { kind: 'rejected', httpStatus: auth.status, error: auth.error }
      );
      return reviewInviteJsonResponse(
        requestId,
        { success: false, error: auth.error },
        auth.status
      );
    }

    const resolved = await resolveCurrentBusinessId(auth.supabase);
    if (!resolved.ok) {
      logReviewInviteFinished(
        buildReviewInviteTrace(requestId, 'mobile_api', { bookingId }),
        {
          kind: 'rejected',
          httpStatus: resolved.status,
          error: resolved.error,
        }
      );
      return reviewInviteJsonResponse(
        requestId,
        { success: false, error: resolved.error },
        resolved.status
      );
    }

    const trace = buildReviewInviteTrace(requestId, 'mobile_api', {
      businessId: resolved.businessId,
      bookingId,
    });

    const result = await requestReviewInviteForBooking(
      auth.supabase,
      resolved.businessId,
      bookingId
    );

    if (!result.ok) {
      logReviewInviteFinished(trace, {
        kind: 'rejected',
        httpStatus: result.status,
        error: result.error,
      });
      return reviewInviteJsonResponse(
        requestId,
        { success: false, error: result.error },
        result.status
      );
    }

    if (result.skipped) {
      logReviewInviteFinished(trace, {
        kind: 'skipped',
        reason: result.reason,
      });
      return reviewInviteJsonResponse(
        requestId,
        {
          success: true,
          sent: false,
          skipped: true,
          reason: result.reason,
        },
        200
      );
    }

    if (!result.sent) {
      logReviewInviteFinished(trace, {
        kind: 'invite_no_email',
        inviteId: result.inviteId,
        emailErrorHint: result.emailErrorHint,
      });
    } else {
      logReviewInviteFinished(trace, {
        kind: 'sent',
        inviteId: result.inviteId,
      });
    }

    return reviewInviteJsonResponse(
      requestId,
      {
        success: true,
        sent: result.sent,
        skipped: false,
        inviteId: result.inviteId,
      },
      200
    );
  } catch (err) {
    logReviewInviteFinished(buildReviewInviteTrace(requestId, 'mobile_api'), {
      kind: 'failed',
      error: err instanceof Error ? err.message : 'unknown',
    });
    return reviewInviteJsonResponse(
      requestId,
      { success: false, error: 'Failed to send review invite' },
      500
    );
  }
}
