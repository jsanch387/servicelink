/**
 * GET /api/payments/transactions
 *
 * Owner activity feed: Stripe charges/refunds/payouts plus offline job
 * collections (cash / payment app / other). Balance header is Stripe-only.
 */

import {
  getTapToPayRequestId,
  tapToPayJsonResponse,
} from '@/features/payments/server/tapToPayRouteLog';
import { PAYMENTS_TRANSACTIONS_LOAD_ERROR } from '@/features/payments/transactions/constants';
import { listOwnerPaymentsTransactions } from '@/features/payments/transactions/listOwnerPaymentsTransactions';
import type { NextRequest } from 'next/server';

export async function GET(request: NextRequest) {
  const requestId = getTapToPayRequestId(request);

  try {
    const result = await listOwnerPaymentsTransactions(request);
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
        balance: result.balance,
        items: result.items,
        hasMore: result.hasMore,
        nextCursor: result.nextCursor,
      },
      200
    );
  } catch (e) {
    console.error('[payments:transactions]', e);
    return tapToPayJsonResponse(
      requestId,
      {
        success: false,
        error: PAYMENTS_TRANSACTIONS_LOAD_ERROR,
      },
      500
    );
  }
}
