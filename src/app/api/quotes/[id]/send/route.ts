/**
 * POST /api/quotes/[id]/send
 *
 * Sends an existing quote that is still `requested` or `draft` (e.g. customer
 * request the owner is turning into a formal sent quote). Same side effects
 * as POST /api/quotes/send (link + email), without inserting a new row.
 */

import { loadDashboardQuoteById } from '@/features/quotes/dashboard/server/loadDashboardQuoteById';
import { validateSendQuoteBody } from '@/features/quotes/send/validateSendQuoteBody';
import {
  getQuoteSendRequestId,
  logQuoteSend,
  maskEmailForLog,
  quoteSendJsonResponse,
  shortUserIdForLog,
  supabaseErrorForLogs,
} from '@/features/quotes/server/quoteSendRouteLog';
import { sendExistingQuoteAsSent } from '@/features/quotes/server/sendExistingQuoteAsSent';
import { getAuthenticatedUser } from '@/libs/api/getAuthenticatedUser';
import { createSupabaseAdminClient } from '@/libs/supabase/admin';
import { assertOwnerQuoteSendRateLimits } from '@/server/rateLimit/ownerQuoteSendRateLimit';
import { resolveCurrentBusinessId } from '@/server/resolveCurrentBusinessId';
import { NextRequest } from 'next/server';

const ROUTE_LABEL = 'POST /api/quotes/[id]/send';

interface RouteContext {
  params: Promise<{ id: string }>;
}

export async function POST(request: NextRequest, { params }: RouteContext) {
  const requestId = getQuoteSendRequestId(request);

  try {
    const { id } = await params;
    const quoteId = id?.trim();
    if (!quoteId) {
      logQuoteSend(requestId, ROUTE_LABEL, 'warn', 'missing_quote_id', {});
      return quoteSendJsonResponse(
        requestId,
        { success: false, error: 'Quote id is required' },
        400
      );
    }

    const auth = await getAuthenticatedUser(request);
    if ('error' in auth) {
      logQuoteSend(requestId, ROUTE_LABEL, 'warn', 'auth_failed', {
        code: auth.code,
        quoteId,
      });
      return quoteSendJsonResponse(
        requestId,
        { success: false, error: auth.error },
        auth.status
      );
    }

    const { user, supabase, authMethod } = auth;

    const rateLimit = await assertOwnerQuoteSendRateLimits(request, user.id);
    if (!rateLimit.ok) {
      logQuoteSend(requestId, ROUTE_LABEL, 'warn', 'rate_limited', {
        authMethod,
        quoteId,
        reason: rateLimit.reason,
        userIdPrefix: shortUserIdForLog(user.id),
      });
      return quoteSendJsonResponse(
        requestId,
        {
          success: false,
          error:
            'Too many quote sends from this account or network. Please try again later.',
        },
        429,
        { 'Retry-After': String(rateLimit.retryAfterSec) }
      );
    }

    let json: unknown;
    try {
      json = await request.json();
    } catch {
      logQuoteSend(requestId, ROUTE_LABEL, 'warn', 'invalid_json_body', {
        authMethod,
        quoteId,
      });
      return quoteSendJsonResponse(
        requestId,
        { success: false, error: 'Invalid JSON body' },
        400
      );
    }

    const parsed = validateSendQuoteBody(json);
    if (!parsed.ok) {
      logQuoteSend(requestId, ROUTE_LABEL, 'warn', 'validation_failed', {
        authMethod,
        quoteId,
        status: parsed.status,
      });
      return quoteSendJsonResponse(
        requestId,
        { success: false, error: parsed.error },
        parsed.status
      );
    }

    const resolved = await resolveCurrentBusinessId(supabase);
    if (!resolved.ok) {
      logQuoteSend(requestId, ROUTE_LABEL, 'warn', 'business_resolve_failed', {
        authMethod,
        quoteId,
      });
      return quoteSendJsonResponse(
        requestId,
        { success: false, error: resolved.error },
        resolved.status
      );
    }

    const admin = createSupabaseAdminClient();

    const { data: business, error: businessError } = await admin
      .from('business_profiles')
      .select('id, business_slug, profile_id, business_name')
      .eq('business_slug', parsed.data.businessSlug)
      .maybeSingle();

    if (businessError || !business) {
      logQuoteSend(requestId, ROUTE_LABEL, 'warn', 'business_lookup_failed', {
        authMethod,
        quoteId,
        businessSlug: parsed.data.businessSlug,
        ...supabaseErrorForLogs(businessError ?? undefined),
      });
      return quoteSendJsonResponse(
        requestId,
        { success: false, error: 'Business not found' },
        404
      );
    }

    const businessRow = business as {
      id: string;
      business_slug: string | null;
      profile_id: string | null;
      business_name: string | null;
    };

    if (
      businessRow.id !== resolved.businessId ||
      !businessRow.profile_id ||
      businessRow.profile_id !== user.id
    ) {
      logQuoteSend(
        requestId,
        ROUTE_LABEL,
        'warn',
        'forbidden_business_mismatch',
        {
          authMethod,
          quoteId,
          userIdPrefix: shortUserIdForLog(user.id),
        }
      );
      return quoteSendJsonResponse(
        requestId,
        { success: false, error: 'Forbidden' },
        403
      );
    }

    const loaded = await loadDashboardQuoteById(
      supabase,
      resolved.businessId,
      quoteId
    );
    if (!loaded.ok) {
      logQuoteSend(requestId, ROUTE_LABEL, 'warn', 'quote_load_failed', {
        authMethod,
        quoteId,
        httpStatus: loaded.status,
      });
      return quoteSendJsonResponse(
        requestId,
        { success: false, error: loaded.error },
        loaded.status
      );
    }

    const businessDisplayName =
      businessRow.business_name?.trim() ||
      businessRow.business_slug?.trim() ||
      'Your service provider';

    const siteOrigin =
      process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, '') ||
      request.nextUrl.origin;

    const result = await sendExistingQuoteAsSent({
      admin,
      quoteId,
      businessId: resolved.businessId,
      ownerUserId: user.id,
      businessDisplayName,
      payload: parsed.data,
      siteOrigin,
    });

    if (!result.ok) {
      logQuoteSend(requestId, ROUTE_LABEL, 'warn', 'send_existing_failed', {
        authMethod,
        quoteId,
        httpStatus: result.status,
      });
      return quoteSendJsonResponse(
        requestId,
        { success: false, error: result.error },
        result.status
      );
    }

    logQuoteSend(requestId, ROUTE_LABEL, 'info', 'quote_sent_ok', {
      authMethod,
      quoteId,
      businessId: resolved.businessId,
      customerEmailMasked: maskEmailForLog(parsed.data.customerEmail),
      expiresAt: result.expiresAt,
    });

    return quoteSendJsonResponse(
      requestId,
      {
        success: true,
        data: {
          quoteId,
          publicUrl: result.publicUrl,
          expiresAt: result.expiresAt,
        },
      },
      200
    );
  } catch (e) {
    logQuoteSend(requestId, ROUTE_LABEL, 'error', 'unhandled_exception', {});
    console.error(ROUTE_LABEL, e);
    return quoteSendJsonResponse(
      requestId,
      { success: false, error: 'Unexpected server error' },
      500
    );
  }
}
