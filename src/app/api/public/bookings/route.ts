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

import { resolvePublicBookingFreeTierGate } from '@/features/availability/booking/server/publicBookingFreeTierCap';
import type { CreateBookingRequest } from '@/features/availability/booking/types';
import {
  bookingCustomerPayloadErrorMessage,
  coerceCustomerFormData,
  normalizeBookingCustomerInput,
} from '@/features/availability/booking/utils/bookingCustomerFieldLimits';
import { coerceBookingCents } from '@/features/availability/booking/utils/coerceBookingCents';
import {
  PUBLIC_BOOKING_MAX_JOBS,
  PUBLIC_BOOKING_MAX_JOBS_MESSAGE,
} from '@/features/availability/booking/constants/publicBookingJobs';
import { isVehicleRelatedBusinessType } from '@/constants/businessTypes';
import { isJobVehicleComplete } from '@/features/availability/booking/utils/visitJobVehicles';
import {
  appointmentFitsSameDay,
  appointmentServiceNameSummary,
  jobGrossCents,
  normalizeStartTimeHHmm,
  parseOwnerManualBookingJobs,
  sumJobDurationMinutes,
  sumJobGrossCents,
  toBookingJobDetails,
  type OwnerManualBookingJobInput,
} from '@/features/availability/booking/utils/ownerManualBookingJobs';
import { appointmentMoneyFieldsFromJobs } from '@/features/availability/booking/utils/resolveBookingLineSubtotalCents';
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
import { isSlotAllowedByLeadTime } from '@/features/availability/utils/minimumNotice';
import { notifyOwnerForAvailabilityBookingCreated } from '@/features/availability/services/notifyOwnerForAvailabilityBookingCreated';
import {
  parseStoredTimeOffBlocks,
  toTimeOffIntervalFields,
} from '@/features/availability/types/blockTime';
import { bookingReferralSourceForBusiness } from '@/features/booking-attribution/server/bookingReferralCookie';
import { isPublicBusinessSlugVisible } from '@/features/business-profile/server/publicBusinessSlugVisibility';
import {
  buildPublicBookingServiceLocation,
  customerUsesShopAddress,
  resolveEffectiveCustomerServiceLocation,
} from '@/features/business-profile/utils/publicServiceLocation';
import { prefillCustomerWithShopAddress } from '@/features/availability/booking/utils/bookingServiceLocationFlow';
import {
  clientServiceLocationChoice,
  resolvePersistedBookingServiceLocationType,
  validateServiceLocationTypeInput,
} from '@/features/availability/booking/utils/resolveBookingServiceLocationType';
import { buildAvailabilityBookingEmailServiceLocation } from '@/features/email/availability-booking-notification/buildAvailabilityBookingEmailServiceLocation';
import { buildPublicBookingNoCheckoutPaymentSummary } from '@/features/email/availability-booking-notification/buildAvailabilityBookingPaymentSummary';
import {
  sendAvailabilityBookingCustomerConfirmationEmail,
  type AvailabilityBookingEmailJob,
  type AvailabilityBookingNotificationPayload,
} from '@/features/email';
import { buildBookingConfirmedSms, sendAndRecordSms } from '@/features/sms';
import { resolveBookingDiscountSnapshot } from '@/features/marketing/server/resolveBookingDiscountSnapshot';
import type { BookingDiscountSnapshot } from '@/features/marketing/server/bookingDiscountSnapshot';
import { promoDiscountResolveErrorMessage } from '@/features/marketing/utils/promoDiscountResolveErrorMessage';
import { normalizeEnteredPromoCode } from '@/features/marketing/server/resolveBookingPromoDiscountSnapshot';
import { paymentSettingsOf } from '@/features/payments/server/paymentSettingsQuery';
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

export async function POST(request: NextRequest) {
  const requestId = getPublicBookingRequestId(request);
  try {
    const body = (await request.json()) as CreateBookingRequest;
    const ownerManualBooking = body.ownerManualBooking === true;
    const hasJobsArray = Array.isArray(body.jobs);

    let parsedJobs: OwnerManualBookingJobInput[] | null = null;
    if (hasJobsArray) {
      const parsed = parseOwnerManualBookingJobs(body.jobs);
      if (!parsed.ok) {
        return publicBookingJson(
          requestId,
          { success: false, error: parsed.error },
          400
        );
      }
      // Public customers: catalog services only, capped at UI max.
      if (!ownerManualBooking) {
        if (parsed.jobs.length > PUBLIC_BOOKING_MAX_JOBS) {
          return publicBookingJson(
            requestId,
            { success: false, error: PUBLIC_BOOKING_MAX_JOBS_MESSAGE },
            400
          );
        }
        const missingCatalog = parsed.jobs.findIndex(j => !j.serviceId);
        if (missingCatalog >= 0) {
          return publicBookingJson(
            requestId,
            {
              success: false,
              error: `Job ${missingCatalog + 1}: catalog service is required`,
            },
            400
          );
        }
      }
      parsedJobs = parsed.jobs;
    }

    if (!body.businessSlug?.trim()) {
      return publicBookingJson(
        requestId,
        { success: false, error: 'Business slug is required' },
        400
      );
    }
    if (!parsedJobs) {
      if (!body.serviceName?.trim()) {
        return publicBookingJson(
          requestId,
          { success: false, error: 'Service name is required' },
          400
        );
      }
      if (
        typeof body.durationMinutes !== 'number' ||
        body.durationMinutes < 1
      ) {
        return publicBookingJson(
          requestId,
          { success: false, error: 'Duration is required' },
          400
        );
      }
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

    let coercedCustomer = coerceCustomerFormData(body.customer);
    // Per-job vehicle lives on jobs[]. Ignore customer vehicle when jobs present.
    if (parsedJobs) {
      coercedCustomer = {
        ...coercedCustomer,
        vehicleYear: '',
        vehicleMake: '',
        vehicleModel: '',
      };
    }

    let ownerAuthMethod: 'bearer' | 'cookie' | 'public' = 'public';

    const supabase = createSupabaseAdminClient();

    const { data: profile, error: profileError } = await supabase
      .from('business_profiles')
      .select(
        'id, business_slug, business_name, profile_id, free_bookings_count, service_location_mode, service_area, business_zip, shop_street_address, shop_unit, business_type'
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

    const serviceLocation = buildPublicBookingServiceLocation(
      profile as Parameters<typeof buildPublicBookingServiceLocation>[0]
    );

    if (
      body.serviceLocationType !== undefined &&
      body.serviceLocationType !== null &&
      body.serviceLocationType !== 'mobile' &&
      body.serviceLocationType !== 'shop'
    ) {
      return publicBookingJson(
        requestId,
        {
          success: false,
          error: 'serviceLocationType must be mobile or shop',
        },
        400
      );
    }

    if (
      body.serviceLocationType === 'mobile' ||
      body.serviceLocationType === 'shop'
    ) {
      const typeValidation = validateServiceLocationTypeInput(
        body.serviceLocationType,
        serviceLocation.mode
      );
      if (!typeValidation.ok) {
        return publicBookingJson(
          requestId,
          { success: false, error: typeValidation.error },
          400
        );
      }
    }

    const clientLocationChoice = clientServiceLocationChoice(body);
    const locationResolved = resolveEffectiveCustomerServiceLocation(
      serviceLocation.mode,
      clientLocationChoice
    );
    if (locationResolved.error || !locationResolved.effective) {
      return publicBookingJson(
        requestId,
        {
          success: false,
          error: locationResolved.error ?? 'Invalid service location',
        },
        400
      );
    }

    if (
      customerUsesShopAddress(
        serviceLocation.mode,
        locationResolved.effective
      ) &&
      !serviceLocation.hasCompleteShopAddress
    ) {
      return publicBookingJson(
        requestId,
        {
          success: false,
          error: 'This business has not finished setting up their shop address',
        },
        400
      );
    }

    const requireCustomerAddress = !customerUsesShopAddress(
      serviceLocation.mode,
      locationResolved.effective
    );

    const requireVehicleFields =
      !ownerManualBooking &&
      isVehicleRelatedBusinessType(
        (profile as { business_type?: string | null }).business_type
      );

    if (requireVehicleFields && parsedJobs) {
      const incompleteJob = parsedJobs.findIndex(
        job => !isJobVehicleComplete(job.vehicle)
      );
      if (incompleteJob >= 0) {
        return publicBookingJson(
          requestId,
          {
            success: false,
            error: `Job ${incompleteJob + 1}: vehicle year, make, and model are required`,
          },
          400
        );
      }
    }

    const customerPayloadErr = bookingCustomerPayloadErrorMessage(
      coercedCustomer,
      {
        requireCustomerAddress,
        // Multi-job vehicles live on jobs[]; only require top-level for single-job.
        requireVehicleFields: requireVehicleFields && !parsedJobs,
      }
    );
    if (customerPayloadErr) {
      return publicBookingJson(
        requestId,
        { success: false, error: customerPayloadErr },
        400
      );
    }

    let sanitizedCustomer = normalizeBookingCustomerInput(coercedCustomer);
    if (!requireCustomerAddress) {
      sanitizedCustomer = normalizeBookingCustomerInput(
        prefillCustomerWithShopAddress(sanitizedCustomer, serviceLocation)
      );
    }

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

    if (!ownerManualBooking) {
      const availabilityRow = await getAvailabilityForBusiness(
        supabase,
        businessId
      );
      const timeOffIntervals = parseStoredTimeOffBlocks(
        availabilityRow?.time_off_blocks
      ).map(toTimeOffIntervalFields);
      const durationMinutes = parsedJobs
        ? sumJobDurationMinutes(parsedJobs)
        : body.durationMinutes!;
      if (
        bookingOverlapsTimeOff(
          body.scheduledDate,
          body.startTime.trim(),
          durationMinutes,
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

      if (
        !isSlotAllowedByLeadTime(
          body.scheduledDate,
          body.startTime.trim(),
          availabilityRow?.minimum_notice
        )
      ) {
        return publicBookingJson(
          requestId,
          {
            success: false,
            error: 'That time is too soon to book. Please choose a later slot.',
          },
          409
        );
      }
    }

    const { ownerHasPro } = await resolvePublicBookingFreeTierGate(supabase, {
      profileId,
      freeBookingsCount: p.free_bookings_count,
    });
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

    const persistedServiceLocationType =
      resolvePersistedBookingServiceLocationType({
        clientChoice: locationResolved.effective ?? clientLocationChoice,
        businessMode: serviceLocation.mode,
      });

    const emailServiceLocation = buildAvailabilityBookingEmailServiceLocation({
      effectiveType: locationResolved.effective,
      shopAddressLabel: serviceLocation.shopAddressLabel,
      customerStreet: sanitizedCustomer.streetAddress,
      customerUnit: sanitizedCustomer.unitApt,
      customerCity: sanitizedCustomer.city,
      customerState: sanitizedCustomer.state,
      customerZip: sanitizedCustomer.zip,
    });

    // -------------------------------------------------------------------------
    // Multi-job appointment (`jobs[]`) — one booking row, jobs as line items
    // (owner manual or public customer visit)
    // -------------------------------------------------------------------------
    if (parsedJobs) {
      const visitStart = normalizeStartTimeHHmm(body.startTime.trim());
      const visitDuration = sumJobDurationMinutes(parsedJobs);
      if (
        !visitStart ||
        !appointmentFitsSameDay(body.startTime.trim(), visitDuration)
      ) {
        return publicBookingJson(
          requestId,
          {
            success: false,
            error:
              'Appointment must fit on the same calendar day. Shorten durations or choose an earlier start time.',
          },
          400
        );
      }

      const visitGross = sumJobGrossCents(parsedJobs);
      const jobDetails = toBookingJobDetails(parsedJobs);
      const moneyFields = appointmentMoneyFieldsFromJobs(parsedJobs);
      // Guard: denormalized columns must equal job_details gross.
      if (moneyFields.visitGrossCents !== visitGross) {
        return publicBookingJson(
          requestId,
          {
            success: false,
            error: 'Something went wrong. Please try again.',
          },
          500
        );
      }
      const serviceNameSummary = appointmentServiceNameSummary(parsedJobs);
      const singleCatalogServiceId =
        parsedJobs.length === 1 ? (parsedJobs[0].serviceId ?? null) : null;

      // Sale applies once to the appointment subtotal (all jobs), unless the
      // owner opted out via applySale: false (web Review checkbox).
      // Public: always apply qualifying sale; promo allowed.
      const ownerWantsSale = !ownerManualBooking || body.applySale !== false;
      const enteredPromoCode = ownerManualBooking
        ? ''
        : normalizeEnteredPromoCode(
            typeof body.promoCode === 'string' ? body.promoCode : ''
          );
      let discountSnapshot: BookingDiscountSnapshot | null = null;
      if (ownerWantsSale) {
        const discountResolved = await resolveBookingDiscountSnapshot(
          supabase,
          {
            businessId,
            ownerHasPro,
            serviceDateYmd: body.scheduledDate,
            subtotalCents: visitGross,
            promoCode: enteredPromoCode || null,
            customerPhone: sanitizedCustomer.phone,
            customerEmail: sanitizedCustomer.email,
            allowPromoCode: !ownerManualBooking,
          }
        );
        if (!discountResolved.ok) {
          return publicBookingJson(
            requestId,
            {
              success: false,
              error: promoDiscountResolveErrorMessage(discountResolved.error),
              errorCode: discountResolved.error,
            },
            400
          );
        }
        discountSnapshot = discountResolved.snapshot;
      }

      // Vehicle columns: copy only when there is exactly one job with a vehicle.
      const singleVehicle =
        parsedJobs.length === 1 &&
        (parsedJobs[0].vehicle.year ||
          parsedJobs[0].vehicle.make ||
          parsedJobs[0].vehicle.model)
          ? parsedJobs[0].vehicle
          : null;
      const customerForInsert = {
        ...sanitizedCustomer,
        vehicleYear: singleVehicle?.year ?? '',
        vehicleMake: singleVehicle?.make ?? '',
        vehicleModel: singleVehicle?.model ?? '',
      };

      const referralSource = ownerManualBooking
        ? null
        : bookingReferralSourceForBusiness(request, businessSlug);

      let result: { id: string; customerId: string; visitId: string };
      try {
        result = await createBooking(supabase, {
          businessId,
          businessSlug,
          bookingSource: ownerManualBooking ? 'owner' : 'public',
          referralSource,
          serviceId: singleCatalogServiceId,
          serviceName: serviceNameSummary,
          servicePriceCents: moneyFields.servicePriceCents,
          // Flatten add-ons onto the booking row so Complete-sheet math
          // (service_price_cents + addon_details) matches job_details.
          selectedAddOns: moneyFields.selectedAddOns,
          durationMinutes: visitDuration,
          scheduledDate: body.scheduledDate,
          startTime: visitStart,
          customer: customerForInsert,
          serviceLocationType: persistedServiceLocationType,
          discountSnapshot,
          jobDetails,
          visitJobCount: parsedJobs.length,
        });
      } catch (createErr) {
        logBookingTransaction(requestId, 'error', 'appointment_create_failed', {
          err:
            createErr instanceof Error
              ? createErr.message.slice(0, 80)
              : String(createErr).slice(0, 80),
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

      try {
        const visitTotalAfterDiscount = discountSnapshot
          ? Math.max(0, visitGross - discountSnapshot.discountCents)
          : visitGross;
        await insertBookingPaymentsRowForNoCheckoutPublicBooking(supabase, {
          bookingId: result.id,
          businessId,
          totalAmountCents: visitTotalAfterDiscount,
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

      const jobCount = parsedJobs.length;
      const emailJobs: AvailabilityBookingEmailJob[] = parsedJobs.map(job => ({
        serviceName: job.serviceName,
        servicePriceOptionLabel:
          job.servicePriceOptionLabel?.trim() || undefined,
        servicePriceCents: job.servicePriceCents,
        selectedAddOns: job.selectedAddOns,
        durationMinutes: job.durationMinutes,
        customerVehicleYear: job.vehicle.year || undefined,
        customerVehicleMake: job.vehicle.make || undefined,
        customerVehicleModel: job.vehicle.model || undefined,
        totalPriceCents: jobGrossCents(job),
      }));

      const hasPriceLineItems = visitGross > 0;
      const paymentSummary = buildPublicBookingNoCheckoutPaymentSummary({
        paymentsEnabled: paySettings?.payments_enabled === true,
        checkoutMode: paySettings?.checkout_mode,
        clientPaymentMethod,
        currency: paySettings?.currency?.trim() || 'usd',
        totalPriceCents: visitGross,
        hasPriceLineItems,
      });

      const serviceSummaryLine =
        jobCount > 1 ? `${jobCount} jobs` : serviceNameSummary;

      const availabilityEmailPayload: AvailabilityBookingNotificationPayload = {
        customerName: sanitizedCustomer.fullName.trim(),
        customerEmail: sanitizedCustomer.email,
        customerPhone: sanitizedCustomer.phone?.trim(),
        serviceName: serviceSummaryLine,
        scheduledDate: body.scheduledDate,
        startTime: visitStart,
        durationMinutes: visitDuration,
        totalPriceCents: visitGross,
        ...(discountSnapshot
          ? {
              discount: {
                label: discountSnapshot.discountLabel,
                discountCents: discountSnapshot.discountCents,
                estimatedTotalCents:
                  discountSnapshot.subtotalCents -
                  discountSnapshot.discountCents,
              },
            }
          : {}),
        jobs: emailJobs,
        paymentSummary,
        serviceLocation: emailServiceLocation,
        customerNotes: sanitizedCustomer.notes?.trim() || undefined,
        createdByOwner: ownerManualBooking || undefined,
      };

      await notifyOwnerForAvailabilityBookingCreated(supabase, {
        correlationId: requestId,
        profileId,
        bookingId: result.id,
        customerName: sanitizedCustomer?.fullName?.trim() ?? 'A customer',
        serviceSummaryLine,
        scheduledDate: body.scheduledDate,
        emailPayload: availabilityEmailPayload,
        jobCount,
      });

      let customerConfirmationOutcome: 'sent' | 'failed' | 'skipped' =
        'skipped';
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

      // SMS: short confirmation ping. Email (above) carries full details.
      // Both channels when both contacts exist — complementary, not exclusive.
      let customerSmsOutcome: 'sent' | 'failed' | 'skipped' | 'no_phone' =
        'skipped';
      if (sanitizedCustomer.phone) {
        const smsResult = await sendAndRecordSms({
          admin: supabase,
          businessId,
          bookingId: result.id,
          customerId: result.customerId,
          type: 'booking_confirmation',
          to: sanitizedCustomer.phone,
          message: buildBookingConfirmedSms({
            scheduledDate: body.scheduledDate,
            startTime: body.startTime.trim(),
          }),
          dedupeKey: `${result.id}:booking_confirmation`,
          correlationId: requestId,
        });
        customerSmsOutcome = smsResult.sent ? 'sent' : 'failed';
      } else {
        customerSmsOutcome = 'no_phone';
      }

      logBookingTransaction(requestId, 'info', 'created', {
        bookingId: result.id,
        visitId: result.visitId,
        jobs: jobCount,
        owner: ownerManualBooking ? 1 : 0,
        auth: ownerAuthMethod,
        email: customerConfirmationOutcome,
        sms: customerSmsOutcome,
      });
      return publicBookingJson(
        requestId,
        {
          success: true,
          data: {
            id: result.id,
            visitId: result.visitId,
            jobCount,
          },
        },
        201
      );
    }

    // -------------------------------------------------------------------------
    // Legacy single-job body (public + owner)
    // -------------------------------------------------------------------------
    const optionLabel = body.servicePriceOptionLabel?.trim();
    const storedServiceName = optionLabel
      ? `${body.serviceName!.trim()} — ${optionLabel}`
      : body.serviceName!.trim();

    const selectedAddOnsForEmail = (body.selectedAddOns ?? []).map(addOn => ({
      ...addOn,
      priceCents: coerceBookingCents(addOn.priceCents),
    }));
    const basePriceForEmail = coerceBookingCents(body.servicePriceCents);
    const addOnTotalForEmail = selectedAddOnsForEmail.reduce(
      (sum, addOn) => sum + addOn.priceCents,
      0
    );
    const totalPriceCentsForEmail = basePriceForEmail + addOnTotalForEmail;

    // Owner manual booking: sale auto-apply only (unless applySale: false).
    // Ignore client promo + discount preview fields — server recomputes.
    const enteredPromoCode = ownerManualBooking
      ? ''
      : normalizeEnteredPromoCode(
          typeof body.promoCode === 'string' ? body.promoCode : ''
        );
    const ownerWantsSale = !ownerManualBooking || body.applySale !== false;
    let discountSnapshot: BookingDiscountSnapshot | null = null;
    if (ownerWantsSale) {
      const discountResolved = await resolveBookingDiscountSnapshot(supabase, {
        businessId,
        ownerHasPro,
        serviceDateYmd: body.scheduledDate,
        subtotalCents: totalPriceCentsForEmail,
        promoCode: enteredPromoCode || null,
        customerPhone: sanitizedCustomer.phone,
        customerEmail: sanitizedCustomer.email,
        allowPromoCode: !ownerManualBooking,
      });
      if (!discountResolved.ok) {
        return publicBookingJson(
          requestId,
          {
            success: false,
            error: promoDiscountResolveErrorMessage(discountResolved.error),
            errorCode: discountResolved.error,
          },
          400
        );
      }
      discountSnapshot = discountResolved.snapshot;
    }

    // Owner-created bookings never belong to a customer acquisition channel.
    const referralSource = ownerManualBooking
      ? null
      : bookingReferralSourceForBusiness(request, businessSlug);

    const result = await createBooking(supabase, {
      businessId,
      businessSlug,
      bookingSource: ownerManualBooking ? 'owner' : 'public',
      referralSource,
      serviceId: body.serviceId,
      serviceName: storedServiceName,
      servicePriceCents: basePriceForEmail,
      selectedAddOns: selectedAddOnsForEmail,
      durationMinutes: body.durationMinutes!,
      scheduledDate: body.scheduledDate,
      startTime: body.startTime.trim(),
      customer: sanitizedCustomer,
      serviceLocationType: persistedServiceLocationType,
      discountSnapshot,
    });

    try {
      const totalAfterDiscount = discountSnapshot
        ? Math.max(0, totalPriceCentsForEmail - discountSnapshot.discountCents)
        : totalPriceCentsForEmail;
      await insertBookingPaymentsRowForNoCheckoutPublicBooking(supabase, {
        bookingId: result.id,
        businessId,
        totalAmountCents: totalAfterDiscount,
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
      basePriceForEmail > 0 || selectedAddOnsForEmail.length > 0;

    const paymentSummary = buildPublicBookingNoCheckoutPaymentSummary({
      paymentsEnabled: paySettings?.payments_enabled === true,
      checkoutMode: paySettings?.checkout_mode,
      clientPaymentMethod,
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
      serviceName: body.serviceName!.trim(),
      servicePriceOptionLabel: optionLabel || undefined,
      scheduledDate: body.scheduledDate,
      startTime: body.startTime.trim(),
      durationMinutes: body.durationMinutes!,
      servicePriceCents: basePriceForEmail || undefined,
      selectedAddOns: selectedAddOnsForEmail,
      totalPriceCents: totalPriceCentsForEmail,
      ...(discountSnapshot
        ? {
            discount: {
              label: discountSnapshot.discountLabel,
              discountCents: discountSnapshot.discountCents,
              estimatedTotalCents:
                discountSnapshot.subtotalCents - discountSnapshot.discountCents,
            },
          }
        : {}),
      paymentSummary,
      serviceLocation: emailServiceLocation,
      customerNotes: sanitizedCustomer.notes?.trim() || undefined,
      createdByOwner: ownerManualBooking || undefined,
    };

    await notifyOwnerForAvailabilityBookingCreated(supabase, {
      correlationId: requestId,
      profileId,
      bookingId: result.id,
      customerName: sanitizedCustomer?.fullName?.trim() ?? 'A customer',
      serviceSummaryLine: storedServiceName,
      scheduledDate: body.scheduledDate,
      emailPayload: availabilityEmailPayload,
      jobCount: 1,
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

    // SMS: short confirmation ping. Email (above) carries full details.
    // Both channels when both contacts exist — complementary, not exclusive.
    let customerSmsOutcome: 'sent' | 'failed' | 'skipped' | 'no_phone' =
      'skipped';
    if (sanitizedCustomer.phone) {
      const smsResult = await sendAndRecordSms({
        admin: supabase,
        businessId,
        bookingId: result.id,
        customerId: result.customerId,
        type: 'booking_confirmation',
        to: sanitizedCustomer.phone,
        message: buildBookingConfirmedSms({
          scheduledDate: body.scheduledDate,
          startTime: body.startTime.trim(),
        }),
        dedupeKey: `${result.id}:booking_confirmation`,
        correlationId: requestId,
      });
      customerSmsOutcome = smsResult.sent ? 'sent' : 'failed';
    } else {
      customerSmsOutcome = 'no_phone';
    }

    logBookingTransaction(requestId, 'info', 'created', {
      bookingId: result.id,
      visitId: result.visitId,
      owner: ownerManualBooking ? 1 : 0,
      auth: ownerAuthMethod,
      email: customerConfirmationOutcome,
      sms: customerSmsOutcome,
      ref: referralSource ?? 'direct',
    });
    return publicBookingJson(
      requestId,
      {
        success: true,
        data: {
          id: result.id,
          visitId: result.visitId,
          jobCount: 1,
        },
      },
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
