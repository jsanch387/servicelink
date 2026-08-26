/**
 * POST /api/payments/tap-to-pay/intent
 *
 * Owner creates a walk-up Tap to Pay PaymentIntent (amount + note, no booking).
 * Mobile collects with Stripe Terminal after this response.
 */

import {
  getTapToPayRequestId,
  tapToPayJsonResponse,
} from '@/features/payments/server/tapToPayRouteLog';
import { WALKUP_TAP_TO_PAY_START_ERROR } from '@/features/payments/walk-up/constants';
import { createWalkUpTapToPayIntent } from '@/features/payments/walk-up/createWalkUpTapToPayIntent';
import type { NextRequest } from 'next/server';

export async function POST(request: NextRequest) {
  const requestId = getTapToPayRequestId(request);

  try {
    const result = await createWalkUpTapToPayIntent(request);
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
        paymentIntentId: result.paymentIntentId,
        clientSecret: result.clientSecret,
        amountCents: result.amountCents,
        currency: result.currency,
        terminalLocationId: result.terminalLocationId,
        stripeAccountId: result.stripeAccountId,
        merchantDisplayName: result.merchantDisplayName,
        locationId: result.terminalLocationId,
        stripe_terminal_location_id: result.terminalLocationId,
      },
      200
    );
  } catch (e) {
    console.error('[walk-up:tap-to-pay]', e);
    return tapToPayJsonResponse(
      requestId,
      {
        success: false,
        error: WALKUP_TAP_TO_PAY_START_ERROR,
      },
      500
    );
  }
}
