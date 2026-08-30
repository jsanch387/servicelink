/**
 * GET /api/payments/revenue
 *
 * Owner completed-job earnings. Same windows and money as mobile Revenue.
 */

import {
  getTapToPayRequestId,
  tapToPayJsonResponse,
} from '@/features/payments/server/tapToPayRouteLog';
import { PAYMENTS_REVENUE_LOAD_ERROR } from '@/features/payments/revenue/constants';
import { loadOwnerPaymentsRevenue } from '@/features/payments/revenue/loadOwnerPaymentsRevenue';
import type { NextRequest } from 'next/server';

export async function GET(request: NextRequest) {
  const requestId = getTapToPayRequestId(request);

  try {
    const result = await loadOwnerPaymentsRevenue(request);
    if (!result.ok) {
      const headers: Record<string, string> = {};
      if (result.retryAfterSec != null) {
        headers['Retry-After'] = String(result.retryAfterSec);
      }
      return tapToPayJsonResponse(
        requestId,
        { success: false, error: result.error },
        result.httpStatus,
        headers
      );
    }

    return tapToPayJsonResponse(
      requestId,
      {
        success: true,
        currency: result.currency,
        period: result.period,
        from: result.fromYmd,
        to: result.toYmd,
        totalCents: result.totalCents,
        totalLabel: result.totalLabel,
        previousTotalCents: result.previousTotalCents,
        changePercent: result.changePercent,
        jobsPaid: result.jobsPaid,
        bucketKind: result.bucketKind,
        buckets: result.buckets,
      },
      200
    );
  } catch (e) {
    console.error('[payments:revenue]', e);
    return tapToPayJsonResponse(
      requestId,
      {
        success: false,
        error: PAYMENTS_REVENUE_LOAD_ERROR,
      },
      500
    );
  }
}
