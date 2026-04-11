/**
 * POST /api/public/quote-request
 *
 * Public quote request from business profile (`/[slug]/quote`). No auth.
 */

import { insertCustomerQuoteRequest } from '@/features/quotes/public-request/server/insertCustomerQuoteRequest';
import { notifyOwnerForPublicQuoteRequest } from '@/features/quotes/public-request/server/notifyOwnerForPublicQuoteRequest';
import { publicQuoteRequestAllowedForSlug } from '@/features/quotes/public-request/server/publicQuoteRequestPageAllowed';
import { validatePublicQuoteRequestBody } from '@/features/quotes/public-request/validatePublicQuoteRequestBody';
import { createSupabaseAdminClient } from '@/libs/supabase/admin';
import {
  assertPublicQuoteRequestRateLimits,
  assertReasonableJsonBodySize,
} from '@/server/rateLimit/publicApiRateLimit';
import { NextRequest, NextResponse } from 'next/server';

const MAX_QUOTE_REQUEST_BODY_BYTES = 64 * 1024;

export async function POST(request: NextRequest) {
  try {
    const tooLarge = assertReasonableJsonBodySize(
      request,
      MAX_QUOTE_REQUEST_BODY_BYTES
    );
    if (tooLarge) return tooLarge;

    let json: unknown;
    try {
      json = await request.json();
    } catch {
      return NextResponse.json(
        { success: false, error: 'Invalid JSON body' },
        { status: 400 }
      );
    }

    const parsed = validatePublicQuoteRequestBody(json);
    if (!parsed.ok) {
      return NextResponse.json(
        { success: false, error: parsed.error },
        { status: parsed.status }
      );
    }

    const rateLimited = await assertPublicQuoteRequestRateLimits(
      request,
      parsed.data.businessSlug
    );
    if (rateLimited) return rateLimited;

    const admin = createSupabaseAdminClient();

    const allowed = await publicQuoteRequestAllowedForSlug(
      admin,
      admin,
      parsed.data.businessSlug
    );
    if (!allowed.ok) {
      return NextResponse.json(
        {
          success: false,
          error: 'Quote requests are not available for this business',
        },
        { status: 403 }
      );
    }

    const businessId = allowed.businessId;

    const inserted = await insertCustomerQuoteRequest(
      admin,
      businessId,
      parsed.data
    );

    if (!inserted.ok) {
      return NextResponse.json(
        { success: false, error: inserted.error },
        { status: 500 }
      );
    }

    try {
      await notifyOwnerForPublicQuoteRequest(admin, {
        profileId: allowed.profileId,
        quoteId: inserted.quoteId,
        customerName: parsed.data.customerName,
        serviceName: parsed.data.serviceName,
        vehicleYear: parsed.data.vehicleYear,
        vehicleMake: parsed.data.vehicleMake,
        vehicleModel: parsed.data.vehicleModel,
        timeline: parsed.data.timeline,
        details: parsed.data.details,
      });
    } catch {
      // Best-effort after successful insert
    }

    return NextResponse.json({ success: true }, { status: 201 });
  } catch (e) {
    console.error('[API] POST /api/public/quote-request', e);
    return NextResponse.json(
      { success: false, error: 'Unexpected server error' },
      { status: 500 }
    );
  }
}
