/**
 * POST /api/payments/tap-to-pay/connection-token
 *
 * Merchant-scoped Stripe Terminal connection token for Tap to Pay app warm-up.
 * No booking context — mobile calls on app launch / foreground.
 */

import { handleMerchantTapToPayConnectionToken } from '@/features/payments/server/handleMerchantTapToPayConnectionToken';
import {
  getTapToPayRequestId,
  tapToPayJsonResponse,
} from '@/features/payments/server/tapToPayRouteLog';
import type { NextRequest } from 'next/server';

export async function POST(request: NextRequest) {
  const requestId = getTapToPayRequestId(request);

  try {
    const result = await handleMerchantTapToPayConnectionToken(request);
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
        secret: result.secret,
      },
      200
    );
  } catch (e) {
    console.error('[tap-to-pay:merchant-connection-token]', e);
    return tapToPayJsonResponse(
      requestId,
      {
        success: false,
        error: "Couldn't connect to payments. Try again or mark as paid.",
      },
      500
    );
  }
}
