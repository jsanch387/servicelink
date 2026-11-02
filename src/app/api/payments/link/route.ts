/**
 * POST /api/payments/link
 *
 * Owner creates a one-time payment link (`/p/{shortCode}`) for a charge
 * (amount + note, no booking). Mobile shares that URL, not Stripe Checkout.
 */

import { createWalkUpPaymentLink } from '@/features/payments/walk-up/createWalkUpPaymentLink';
import {
  getTapToPayRequestId,
  tapToPayJsonResponse,
} from '@/features/payments/server/tapToPayRouteLog';
import type { NextRequest } from 'next/server';

export async function POST(request: NextRequest) {
  const requestId = getTapToPayRequestId(request);

  try {
    const result = await createWalkUpPaymentLink(request);
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
        url: result.url,
        paymentLinkId: result.paymentLinkId,
        paymentRequestId: result.paymentRequestId,
      },
      200
    );
  } catch (e) {
    console.error('[walk-up:payment-link]', e);
    return tapToPayJsonResponse(
      requestId,
      {
        success: false,
        error: 'Could not create a payment link.',
      },
      500
    );
  }
}
