import {
  sendQuoteSentToCustomerEmail,
  type QuoteSentToCustomerPayload,
} from '@/features/email';
import { validateSendQuoteBody } from '@/features/quotes/send/validateSendQuoteBody';
import {
  getQuoteSendRequestId,
  logQuoteSend,
  quoteSendJsonResponse,
  shortUserIdForLog,
  supabaseErrorForLogs,
  truncateLogDetail,
} from '@/features/quotes/server/quoteSendRouteLog';
import { getAuthenticatedUser } from '@/libs/api/getAuthenticatedUser';
import { createSupabaseAdminClient } from '@/libs/supabase/admin';
import { assertOwnerQuoteSendRateLimits } from '@/server/rateLimit/ownerQuoteSendRateLimit';
import crypto from 'crypto';
import { NextRequest } from 'next/server';

const ROUTE_LABEL = 'POST /api/quotes/send';

export async function POST(request: NextRequest) {
  const requestId = getQuoteSendRequestId(request);

  try {
    const auth = await getAuthenticatedUser(request);
    if ('error' in auth) {
      logQuoteSend(requestId, ROUTE_LABEL, 'warn', 'auth_failed', {
        code: auth.code,
      });
      return quoteSendJsonResponse(
        requestId,
        { success: false, error: auth.error },
        auth.status
      );
    }

    const { user, authMethod } = auth;

    const rateLimit = await assertOwnerQuoteSendRateLimits(request, user.id);
    if (!rateLimit.ok) {
      logQuoteSend(requestId, ROUTE_LABEL, 'warn', 'rate_limited', {
        authMethod,
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
        status: parsed.status,
      });
      return quoteSendJsonResponse(
        requestId,
        { success: false, error: parsed.error },
        parsed.status
      );
    }
    const body = parsed.data;

    const admin = createSupabaseAdminClient();

    const { data: business, error: businessError } = await admin
      .from('business_profiles')
      .select('id, business_slug, profile_id, business_name')
      .eq('business_slug', body.businessSlug)
      .maybeSingle();

    if (businessError || !business) {
      logQuoteSend(requestId, ROUTE_LABEL, 'warn', 'business_lookup_failed', {
        authMethod,
        businessSlug: body.businessSlug,
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

    const businessDisplayName =
      businessRow.business_name?.trim() ||
      businessRow.business_slug?.trim() ||
      'Your service provider';

    const vehicleLine =
      [body.vehicleYear, body.vehicleMake, body.vehicleModel]
        .map(v => (v ?? '').trim())
        .filter(Boolean)
        .join(' ') || null;

    if (!businessRow.profile_id || businessRow.profile_id !== user.id) {
      logQuoteSend(
        requestId,
        ROUTE_LABEL,
        'warn',
        'forbidden_business_mismatch',
        {
          authMethod,
          businessSlug: body.businessSlug,
          userIdPrefix: shortUserIdForLog(user.id),
        }
      );
      return quoteSendJsonResponse(
        requestId,
        { success: false, error: 'Forbidden' },
        403
      );
    }

    // `quotes` / `quote_public_links` may not yet be in generated DB types.
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const db = admin as any;

    const { data: quote, error: quoteError } = await db
      .from('quotes')
      .insert({
        business_id: businessRow.id,
        created_by_user_id: user.id,
        customer_name: body.customerName,
        customer_email: body.customerEmail,
        customer_phone: body.customerPhoneDigits,
        vehicle_year: body.vehicleYear,
        vehicle_make: body.vehicleMake,
        vehicle_model: body.vehicleModel,
        service_name: body.serviceName,
        price_cents: body.priceCents,
        duration_minutes: body.durationMinutes,
        note: body.note,
        scheduled_date: body.scheduledDate,
        scheduled_start_time: body.scheduledStartTimeForDb,
        service_id: body.serviceId,
        service_price_option_id: body.servicePriceOptionId,
        service_price_cents: body.servicePriceCents,
        addon_details: body.addonDetails,
        status: 'sent',
        sent_at: new Date().toISOString(),
      })
      .select('id')
      .single();

    if (quoteError || !quote) {
      logQuoteSend(requestId, ROUTE_LABEL, 'error', 'quote_insert_failed', {
        authMethod,
        businessId: businessRow.id,
        ...supabaseErrorForLogs(quoteError ?? undefined),
      });
      return quoteSendJsonResponse(
        requestId,
        { success: false, error: 'Failed to create quote' },
        500
      );
    }

    const quoteId = (quote as { id: string }).id;
    const rawToken = crypto.randomBytes(32).toString('base64url');
    const tokenHash = crypto
      .createHash('sha256')
      .update(rawToken)
      .digest('hex');
    const expiresAt = new Date(
      Date.now() + 1000 * 60 * 60 * 24 * 14
    ).toISOString(); // 14 days

    const { error: linkError } = await db.from('quote_public_links').insert({
      quote_id: quoteId,
      token_hash: tokenHash,
      expires_at: expiresAt,
      is_active: true,
    });

    if (linkError) {
      logQuoteSend(
        requestId,
        ROUTE_LABEL,
        'error',
        'quote_link_insert_failed',
        {
          authMethod,
          quoteId,
          ...supabaseErrorForLogs(linkError ?? undefined),
        }
      );
      return quoteSendJsonResponse(
        requestId,
        { success: false, error: 'Failed to create quote link' },
        500
      );
    }

    const origin =
      process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, '') ||
      request.nextUrl.origin;
    const publicUrl = `${origin}/q/${rawToken}`;

    try {
      const emailPayload: QuoteSentToCustomerPayload = {
        customerName: body.customerName,
        serviceName: body.serviceName,
        businessName: businessDisplayName,
        priceCents: body.priceCents,
        scheduledDate: body.scheduledDate,
        scheduledStartTime: body.scheduledStartTimeForDb,
        durationMinutes: body.durationMinutes,
        note: body.note,
        customerRequestMessage: null,
        vehicleLine,
        publicQuoteUrl: publicUrl,
        addonDetails: body.addonDetails,
      };
      const emailResult = await sendQuoteSentToCustomerEmail(
        body.customerEmail,
        emailPayload
      );
      if (!emailResult.sent) {
        logQuoteSend(requestId, ROUTE_LABEL, 'warn', 'customer_email_skipped', {
          authMethod,
          quoteId,
          emailErrorHint: emailResult.error
            ? truncateLogDetail(String(emailResult.error))
            : undefined,
        });
      }
    } catch (emailErr) {
      const errHint =
        emailErr instanceof Error
          ? truncateLogDetail(emailErr.message)
          : truncateLogDetail(String(emailErr));
      logQuoteSend(requestId, ROUTE_LABEL, 'warn', 'customer_email_exception', {
        authMethod,
        quoteId,
        errHint: errHint || undefined,
      });
    }

    logQuoteSend(requestId, ROUTE_LABEL, 'info', 'quote_sent_ok', {
      authMethod,
      quoteId,
      businessId: businessRow.id,
    });

    return quoteSendJsonResponse(
      requestId,
      { success: true, data: { quoteId, publicUrl, expiresAt } },
      201
    );
  } catch (error) {
    logQuoteSend(requestId, ROUTE_LABEL, 'error', 'unhandled_exception', {});
    console.error(ROUTE_LABEL, error);
    return quoteSendJsonResponse(
      requestId,
      { success: false, error: 'Failed to send quote' },
      500
    );
  }
}
