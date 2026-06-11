/**
 * POST /api/public/bookings
 *
 * Creates a V2 (availability) booking. Public endpoint.
 * Owner dashboard / mobile owner booking (`ownerManualBooking`) requires auth
 * for the same business as `businessId`:
 * - Web: Supabase session cookies
 * - Mobile: `Authorization: Bearer <Supabase access_token>` (same body as web)
 * Otherwise resolves business by slug only (customer self-serve).
 */

import type { CreateBookingRequest } from '@/features/availability/booking/types';
import {
  bookingCustomerPayloadErrorMessage,
  coerceCustomerFormData,
  normalizeBookingCustomerInput,
} from '@/features/availability/booking/utils/bookingCustomerFieldLimits';
import { bookingOverlapsTimeOff } from '@/features/availability/booking/utils/slotGeneration';
import {
  getPublicBookingRequestId,
  logBookingTransaction,
} from '@/features/availability/server/publicBookingRouteLog';
import { getAvailabilityForBusiness } from '@/features/availability/services/availabilityService';
import {
  createBooking,
  insertBookingPaymentsRowForNoCheckoutPublicBooking,
} from '@/features/availability/services/bookingService';
import { enforceFreeTierBookingCapBeforeCreate } from '@/features/availability/services/enforceFreeTierBookingCapBeforeCreate';
import { notifyOwnerForAvailabilityBookingCreated } from '@/features/availability/services/notifyOwnerForAvailabilityBookingCreated';
import { parseStoredTimeOffBlocks } from '@/features/availability/types/blockTime';
import { isPublicBusinessSlugVisible } from '@/features/business-profile/server/publicBusinessSlugVisibility';
import {
  sendAvailabilityBookingCustomerConfirmationEmail,
  type AvailabilityBookingNotificationPayload,
  type AvailabilityBookingPaymentSummary,
} from '@/features/email';
import { paymentSettingsOf } from '@/features/payments/server/paymentSettingsQuery';
import { buildBookingConfirmedSms, sendAndRecordSms } from '@/features/sms';
import { getAuthenticatedUser } from '@/libs/api/getAuthenticatedUser';
import { createSupabaseAdminClient } from '@/libs/supabase/admin';
import { resolveCurrentBusinessId } from '@/server/resolveCurrentBusinessId';
import { NextRequest, NextResponse } from 'next/server';

function publicBookingJson(
  requestId: string,
  body: unknown,
  status: number
): NextResponse {
  return NextResponse.json(body, {
    status,
    headers: {
      'X-Request-ID': requestId,
      'Cache-Control': 'no-store',
    },
  });
}

function buildPaymentSummaryForPublicBooking(params: {
  paymentsEnabled: boolean;
  checkoutMode: string | null | undefined;
  currency: string;
  totalPriceCents: number;
  /** Email shows a Price details card with this total when true — avoid duplicating the row here. */
  hasPriceLineItems: boolean;
}): AvailabilityBookingPaymentSummary {
  const code = /^[a-z]{3}$/.test(params.currency.trim().toLowerCase())
    ? params.currency.trim().toLowerCase()
    : 'usd';
  const fmt = (cents: number) =>
    new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: code.toUpperCase(),
    }).format(cents / 100);

  const rows: Array<{ label: string; value: string }> = [];

  if (!params.paymentsEnabled) {
    rows.push({
      label: 'Online payment',
      value: 'Not required for this booking',
    });
  } else if (params.checkoutMode === 'in_person') {
    rows.push({
      label: 'How you pay',
      value: 'Pay your provider when you meet',
    });
    rows.push({
      label: 'ServiceLink card charge',
      value: 'None',
    });
  } else {
    rows.push({
      label: 'ServiceLink card charge',
      value: 'None for this booking',
    });
  }

  if (params.totalPriceCents > 0 && !params.hasPriceLineItems) {
    rows.push({
      label: 'Appointment total',
      value: fmt(params.totalPriceCents),
    });
  }

  return {
    title: 'Payment',
    rows,
  };
}

export async function POST(request: NextRequest) {
  const requestId = getPublicBookingRequestId(request);
  try {
    const body = (await request.json()) as CreateBookingRequest;

    if (!body.businessSlug?.trim()) {
      return publicBookingJson(
        requestId,
        { success: false, error: 'Business slug is required' },
        400
      );
    }
    if (!body.serviceName?.trim()) {
      return publicBookingJson(
        requestId,
        { success: false, error: 'Service name is required' },
        400
      );
    }
    if (
      !body.scheduledDate?.trim() ||
      !/^\d{4}-\d{2}-\d{2}$/.test(body.scheduledDate)
    ) {
      return publicBookingJson(
        requestId,
        {
          success: false,
          error: 'Valid scheduled date (YYYY-MM-DD) is required',
        },
        400
      );
    }
    if (!body.startTime?.trim() || !/^\d{1,2}:\d{2}$/.test(body.startTime)) {
      return publicBookingJson(
        requestId,
        { success: false, error: 'Valid start time (HH:mm) is required' },
        400
      );
    }
    if (typeof body.durationMinutes !== 'number' || body.durationMinutes < 1) {
      return publicBookingJson(
        requestId,
        { success: false, error: 'Duration is required' },
        400
      );
    }
    const ownerManualBooking = body.ownerManualBooking === true;
    const coercedCustomer = coerceCustomerFormData(body.customer);
    const customerPayloadErr =
      bookingCustomerPayloadErrorMessage(coercedCustomer);
    if (customerPayloadErr) {
      return publicBookingJson(
        requestId,
        { success: false, error: customerPayloadErr },
        400
      );
    }
    const sanitizedCustomer = normalizeBookingCustomerInput(coercedCustomer);

    let ownerAuthMethod: 'bearer' | 'cookie' | 'public' = 'public';

    if (ownerManualBooking) {
      if (!body.businessId?.trim()) {
        return publicBookingJson(
          requestId,
          { success: false, error: 'Business id is required' },
          400
        );
      }
      const auth = await getAuthenticatedUser(request);
      if ('error' in auth) {
        logBookingTransaction(requestId, 'warn', 'owner_auth', {
          http: auth.status,
        });
        return publicBookingJson(
          requestId,
          { success: false, error: auth.error },
          auth.status
        );
      }
      const resolved = await resolveCurrentBusinessId(auth.supabase);
      if (!resolved.ok) {
        logBookingTransaction(requestId, 'warn', 'owner_business', {
          http: resolved.status,
        });
        return publicBookingJson(
          requestId,
          { success: false, error: resolved.error },
          resolved.status
        );
      }
      if (resolved.businessId !== body.businessId.trim()) {
        logBookingTransaction(requestId, 'warn', 'owner_forbidden', {});
        return publicBookingJson(
          requestId,
          { success: false, error: 'Forbidden' },
          403
        );
      }
      ownerAuthMethod = auth.authMethod;
    }

    const supabase = createSupabaseAdminClient();

    const { data: profile, error: profileError } = await supabase
      .from('business_profiles')
      .select(
        'id, business_slug, business_name, profile_id, free_bookings_count'
      )
      .eq('business_slug', body.businessSlug.trim())
      .single();

    if (profileError || !profile) {
      return publicBookingJson(
        requestId,
        { success: false, error: 'Business not found' },
        404
      );
    }

    if (
      !(await isPublicBusinessSlugVisible(supabase, body.businessSlug.trim()))
    ) {
      return publicBookingJson(
        requestId,
        { success: false, error: 'Business not found' },
        404
      );
    }

    const p = profile as {
      id: string;
      business_slug: string | null;
      business_name: string | null;
      profile_id: string | null;
      free_bookings_count: number | null;
    };
    const businessId = p.id;
    const businessSlug = p.business_slug ?? body.businessSlug.trim();
    const businessDisplayName = p.business_name?.trim() || businessSlug;
    const profileId = p.profile_id ?? null;

    if (!body.businessId?.trim() || body.businessId.trim() !== businessId) {
      return publicBookingJson(
        requestId,
        { success: false, error: 'Invalid request' },
        400
      );
    }

    const cap = await enforceFreeTierBookingCapBeforeCreate(supabase, {
      id: businessId,
      profile_id: profileId,
      free_bookings_count: p.free_bookings_count,
    });
    if (!cap.ok) {
      return publicBookingJson(
        requestId,
        { success: false, error: cap.message },
        403
      );
    }

    const availabilityRow = await getAvailabilityForBusiness(
      supabase,
      businessId
    );
    const timeOffIntervals = parseStoredTimeOffBlocks(
      availabilityRow?.time_off_blocks
    );
    if (
      bookingOverlapsTimeOff(
        body.scheduledDate,
        body.startTime.trim(),
        body.durationMinutes,
        timeOffIntervals
      )
    ) {
      return publicBookingJson(
        requestId,
        {
          success: false,
          error: 'That time is not available. Please choose another slot.',
        },
        409
      );
    }

    const optionLabel = body.servicePriceOptionLabel?.trim();
    const storedServiceName = optionLabel
      ? `${body.serviceName.trim()} — ${optionLabel}`
      : body.serviceName.trim();

    const result = await createBooking(supabase, {
      businessId,
      businessSlug,
      serviceId: body.serviceId,
      serviceName: storedServiceName,
      servicePriceCents: body.servicePriceCents,
      selectedAddOns: body.selectedAddOns,
      durationMinutes: body.durationMinutes,
      scheduledDate: body.scheduledDate,
      startTime: body.startTime.trim(),
      customer: sanitizedCustomer,
    });

    const selectedAddOnsForEmail = body.selectedAddOns ?? [];
    const basePriceForEmail = body.servicePriceCents ?? 0;
    const addOnTotalForEmail = selectedAddOnsForEmail.reduce(
      (s, a) => s + a.priceCents,
      0
    );
    const totalPriceCentsForEmail = basePriceForEmail + addOnTotalForEmail;

    const { data: paymentSettingsRow, error: paymentSettingsError } =
      await paymentSettingsOf(supabase)
        .select('payments_enabled, checkout_mode, currency')
        .eq('business_id', businessId)
        .maybeSingle();

    if (paymentSettingsError) {
      logBookingTransaction(requestId, 'warn', 'pay_settings', {
        code: paymentSettingsError.code ?? 'unknown',
      });
    }

    const paySettings = paymentSettingsRow as {
      payments_enabled?: boolean;
      checkout_mode?: string | null;
      currency?: string | null;
    } | null;

    const rawClientPm = body.paymentMethodSelected;
    const clientPaymentMethod =
      rawClientPm === 'pay_in_person' ||
      rawClientPm === 'pay_now' ||
      rawClientPm === 'none'
        ? rawClientPm
        : null;

    try {
      await insertBookingPaymentsRowForNoCheckoutPublicBooking(supabase, {
        bookingId: result.id,
        businessId,
        totalAmountCents: totalPriceCentsForEmail,
        currency: paySettings?.currency?.trim() || 'usd',
        paymentsEnabled: paySettings?.payments_enabled === true,
        checkoutMode: paySettings?.checkout_mode ?? null,
        clientPaymentMethod,
      });
    } catch (payErr) {
      logBookingTransaction(requestId, 'error', 'payments_failed', {
        bookingId: result.id,
        err:
          payErr instanceof Error
            ? payErr.message.slice(0, 80)
            : String(payErr).slice(0, 80),
      });
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      await (supabase as any).from('bookings').delete().eq('id', result.id);
      return publicBookingJson(
        requestId,
        {
          success: false,
          error: 'Something went wrong. Please try again.',
        },
        500
      );
    }

    const hasPriceLineItems =
      (typeof body.servicePriceCents === 'number' &&
        body.servicePriceCents > 0) ||
      selectedAddOnsForEmail.length > 0;

    const paymentSummary = buildPaymentSummaryForPublicBooking({
      paymentsEnabled: paySettings?.payments_enabled === true,
      checkoutMode: paySettings?.checkout_mode,
      currency: paySettings?.currency?.trim() || 'usd',
      totalPriceCents: totalPriceCentsForEmail,
      hasPriceLineItems,
    });

    const availabilityEmailPayload: AvailabilityBookingNotificationPayload = {
      customerName: sanitizedCustomer.fullName.trim(),
      customerEmail: sanitizedCustomer.email,
      customerPhone: sanitizedCustomer.phone?.trim(),
      customerVehicleYear: sanitizedCustomer.vehicleYear?.trim(),
      customerVehicleMake: sanitizedCustomer.vehicleMake?.trim(),
      customerVehicleModel: sanitizedCustomer.vehicleModel?.trim(),
      serviceName: body.serviceName.trim(),
      servicePriceOptionLabel: optionLabel || undefined,
      scheduledDate: body.scheduledDate,
      startTime: body.startTime.trim(),
      durationMinutes: body.durationMinutes,
      servicePriceCents: body.servicePriceCents,
      selectedAddOns: selectedAddOnsForEmail,
      totalPriceCents: totalPriceCentsForEmail,
      paymentSummary,
    };

    await notifyOwnerForAvailabilityBookingCreated(supabase, {
      correlationId: requestId,
      profileId,
      bookingId: result.id,
      customerName: sanitizedCustomer?.fullName?.trim() ?? 'A customer',
      serviceSummaryLine: storedServiceName,
      scheduledDate: body.scheduledDate,
      emailPayload: availabilityEmailPayload,
    });

    let customerConfirmationOutcome: 'sent' | 'failed' | 'skipped' = 'skipped';
    if (sanitizedCustomer.email) {
      try {
        await sendAvailabilityBookingCustomerConfirmationEmail(
          sanitizedCustomer.email,
          businessDisplayName,
          availabilityEmailPayload
        );
        customerConfirmationOutcome = 'sent';
      } catch (emailErr) {
        customerConfirmationOutcome = 'failed';
        logBookingTransaction(requestId, 'warn', 'customer_mail', {
          err:
            emailErr instanceof Error
              ? emailErr.message.slice(0, 72)
              : String(emailErr).slice(0, 72),
        });
      }
    }

    if (sanitizedCustomer.phone) {
      await sendAndRecordSms({
        admin: supabase,
        businessId,
        bookingId: result.id,
        customerId: result.customerId,
        type: 'booking_confirmation',
        to: sanitizedCustomer.phone,
        message: buildBookingConfirmedSms({
          businessName: businessDisplayName,
          scheduledDate: body.scheduledDate,
          startTime: body.startTime.trim(),
        }),
        dedupeKey: `${result.id}:booking_confirmation`,
        correlationId: requestId,
      });
    }

    logBookingTransaction(requestId, 'info', 'created', {
      bookingId: result.id,
      owner: ownerManualBooking ? 1 : 0,
      auth: ownerAuthMethod,
      email: customerConfirmationOutcome,
    });
    return publicBookingJson(
      requestId,
      { success: true, data: { id: result.id } },
      201
    );
  } catch (err) {
    logBookingTransaction(requestId, 'error', 'unhandled', {
      err:
        err instanceof Error
          ? err.message.slice(0, 120)
          : String(err).slice(0, 120),
    });
    return publicBookingJson(
      requestId,
      {
        success: false,
        error: 'Something went wrong. Please try again.',
      },
      500
    );
  }
}
