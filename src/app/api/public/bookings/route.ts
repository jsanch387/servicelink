/**
 * POST /api/public/bookings
 *
 * Creates a V2 (availability) booking. Public endpoint; no auth.
 * Resolves business by slug, then inserts one row into bookings via feature service.
 */

import type { CreateBookingRequest } from '@/features/availability/booking/types';
import { bookingOverlapsTimeOff } from '@/features/availability/booking/utils/slotGeneration';
import { getAvailabilityForBusiness } from '@/features/availability/services/availabilityService';
import { createBooking } from '@/features/availability/services/bookingService';
import { enforceFreeTierBookingCapBeforeCreate } from '@/features/availability/services/enforceFreeTierBookingCapBeforeCreate';
import { notifyOwnerForAvailabilityBookingCreated } from '@/features/availability/services/notifyOwnerForAvailabilityBookingCreated';
import { parseStoredTimeOffBlocks } from '@/features/availability/types/blockTime';
import {
  sendAvailabilityBookingCustomerConfirmationEmail,
  type AvailabilityBookingNotificationPayload,
  type AvailabilityBookingPaymentSummary,
} from '@/features/email';
import { paymentSettingsOf } from '@/features/payments/server/paymentSettingsQuery';
import { createSupabaseAdminClient } from '@/libs/supabase/admin';
import { NextRequest, NextResponse } from 'next/server';

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
  try {
    const body = (await request.json()) as CreateBookingRequest;

    if (!body.businessSlug?.trim()) {
      return NextResponse.json(
        { success: false, error: 'Business slug is required' },
        { status: 400 }
      );
    }
    if (!body.serviceName?.trim()) {
      return NextResponse.json(
        { success: false, error: 'Service name is required' },
        { status: 400 }
      );
    }
    if (
      !body.scheduledDate?.trim() ||
      !/^\d{4}-\d{2}-\d{2}$/.test(body.scheduledDate)
    ) {
      return NextResponse.json(
        {
          success: false,
          error: 'Valid scheduled date (YYYY-MM-DD) is required',
        },
        { status: 400 }
      );
    }
    if (!body.startTime?.trim() || !/^\d{1,2}:\d{2}$/.test(body.startTime)) {
      return NextResponse.json(
        { success: false, error: 'Valid start time (HH:mm) is required' },
        { status: 400 }
      );
    }
    if (typeof body.durationMinutes !== 'number' || body.durationMinutes < 1) {
      return NextResponse.json(
        { success: false, error: 'Duration is required' },
        { status: 400 }
      );
    }
    const customer = body.customer;
    if (!customer?.fullName?.trim()) {
      return NextResponse.json(
        { success: false, error: 'Customer name is required' },
        { status: 400 }
      );
    }
    if (!customer?.email?.trim()) {
      return NextResponse.json(
        { success: false, error: 'Customer email is required' },
        { status: 400 }
      );
    }

    const supabase = createSupabaseAdminClient();

    const { data: profile, error: profileError } = await supabase
      .from('business_profiles')
      .select(
        'id, business_slug, business_name, profile_id, free_bookings_month, free_bookings_count'
      )
      .eq('business_slug', body.businessSlug.trim())
      .single();

    if (profileError || !profile) {
      return NextResponse.json(
        { success: false, error: 'Business not found' },
        { status: 404 }
      );
    }

    const p = profile as {
      id: string;
      business_slug: string | null;
      business_name: string | null;
      profile_id: string | null;
      free_bookings_month: string | null;
      free_bookings_count: number | null;
    };
    const businessId = p.id;
    const businessSlug = p.business_slug ?? body.businessSlug.trim();
    const businessDisplayName = p.business_name?.trim() || businessSlug;
    const profileId = p.profile_id ?? null;

    const cap = await enforceFreeTierBookingCapBeforeCreate(supabase, {
      id: businessId,
      profile_id: profileId,
      free_bookings_month: p.free_bookings_month,
      free_bookings_count: p.free_bookings_count,
    });
    if (!cap.ok) {
      return NextResponse.json(
        { success: false, error: cap.message },
        { status: 403 }
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
      return NextResponse.json(
        {
          success: false,
          error: 'That time is not available. Please choose another slot.',
        },
        { status: 409 }
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
      customer: body.customer,
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
      console.error(
        '[API] POST /api/public/bookings payment_settings',
        paymentSettingsError
      );
    }

    const paySettings = paymentSettingsRow as {
      payments_enabled?: boolean;
      checkout_mode?: string | null;
      currency?: string | null;
    } | null;

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
      customerName: body.customer.fullName.trim(),
      customerEmail: body.customer.email.trim(),
      customerPhone: body.customer.phone?.trim(),
      customerVehicleYear: body.customer.vehicleYear?.trim(),
      customerVehicleMake: body.customer.vehicleMake?.trim(),
      customerVehicleModel: body.customer.vehicleModel?.trim(),
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
      profileId,
      bookingId: result.id,
      customerName: body.customer?.fullName?.trim() ?? 'A customer',
      serviceSummaryLine: storedServiceName,
      scheduledDate: body.scheduledDate,
      emailPayload: availabilityEmailPayload,
    });

    try {
      await sendAvailabilityBookingCustomerConfirmationEmail(
        body.customer.email.trim(),
        businessDisplayName,
        availabilityEmailPayload
      );
    } catch {
      // Best-effort; booking already succeeded
    }

    return NextResponse.json(
      { success: true, data: { id: result.id } },
      { status: 201 }
    );
  } catch (err) {
    console.error('[API] POST /api/public/bookings:', err);
    return NextResponse.json(
      {
        success: false,
        error: err instanceof Error ? err.message : 'Failed to create booking',
      },
      { status: 500 }
    );
  }
}
