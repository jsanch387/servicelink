import { getPublicMaintenanceEnrollmentPath } from '@/constants/routes';
import { serviceDurationHHmmToMinutes } from '@/features/availability/utils/timeOptions';
import { sendMaintenanceEnrollmentSentEmail } from '@/features/email/maintenance-enrollment-sent/sendMaintenanceEnrollmentSentEmail';
import { getAppBaseUrl } from '@/features/email/services/resendClient';
import {
  checkMaintenanceAnchorAgainstCalendar,
  maintenanceSlotAvailabilityUserMessage,
} from '@/features/maintenance/server/checkMaintenanceAnchorAgainstCalendar';
import {
  MAINTENANCE_ANCHOR_PLACEHOLDER_DATE,
  MAINTENANCE_ANCHOR_PLACEHOLDER_TIME,
} from '@/features/maintenance/server/hasMaintenanceAnchorScheduled';
import { maintenanceOwnerPaymentModeFromCheckout } from '@/features/maintenance/server/maintenanceOwnerPaymentMode';
import { maintenanceDetailServiceLabel } from '@/features/maintenance/utils/maintenanceDetailServiceLabel';
import { paymentAccountsOf } from '@/features/payments/server/paymentAccountsQuery';
import { paymentSettingsOf } from '@/features/payments/server/paymentSettingsQuery';
import { checkoutModeFromDb } from '@/features/payments/utils/paymentSettingsMaps';
import { resolveQuoteTokenHash } from '@/features/quotes/shared/utils/resolveQuoteTokenHash';
import { createSupabaseServerClient } from '@/libs/supabase/server';
import { resolveCurrentBusinessId } from '@/server/resolveCurrentBusinessId';
import crypto from 'crypto';
import { NextRequest, NextResponse } from 'next/server';

interface MaintenanceEnrollmentBody {
  customerId?: string;
  serviceNameSnapshot?: string;
  priceCents?: number;
  frequencyWeeks?: number;
  durationMinutes?: number;
  durationHHmm?: string;
  anchorDate?: string;
  anchorTime?: string;
}

function isIsoDate(value: string): boolean {
  return /^\d{4}-\d{2}-\d{2}$/.test(value);
}

function isTimeHHmm(value: string): boolean {
  return /^([01]\d|2[0-3]):([0-5]\d)$/.test(value);
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createSupabaseServerClient();
    const resolved = await resolveCurrentBusinessId(supabase);

    if (!resolved.ok) {
      return NextResponse.json(
        { success: false, error: resolved.error },
        { status: resolved.status }
      );
    }

    const businessId = resolved.businessId;
    const body = (await request.json()) as MaintenanceEnrollmentBody;

    const customerId = body.customerId?.trim() ?? '';
    if (!customerId) {
      return NextResponse.json(
        { success: false, error: 'Customer is required' },
        { status: 400 }
      );
    }

    const serviceNameSnapshot =
      body.serviceNameSnapshot?.trim() || 'Maintenance';
    const priceCents =
      typeof body.priceCents === 'number'
        ? Math.max(0, Math.floor(body.priceCents))
        : NaN;
    const frequencyWeeks =
      typeof body.frequencyWeeks === 'number'
        ? Math.max(0, Math.floor(body.frequencyWeeks))
        : NaN;
    const durationMinutes =
      typeof body.durationMinutes === 'number'
        ? Math.max(0, Math.floor(body.durationMinutes))
        : typeof body.durationHHmm === 'string'
          ? serviceDurationHHmmToMinutes(body.durationHHmm)
          : NaN;
    const anchorDate =
      typeof body.anchorDate === 'string' ? body.anchorDate : '';
    const anchorTime =
      typeof body.anchorTime === 'string' ? body.anchorTime : '';

    if (!Number.isFinite(priceCents)) {
      return NextResponse.json(
        { success: false, error: 'Price is required' },
        { status: 400 }
      );
    }

    if (!Number.isFinite(frequencyWeeks) || frequencyWeeks < 1) {
      return NextResponse.json(
        { success: false, error: 'Frequency is required' },
        { status: 400 }
      );
    }

    if (!Number.isFinite(durationMinutes) || durationMinutes < 30) {
      return NextResponse.json(
        { success: false, error: 'Visit duration is required' },
        { status: 400 }
      );
    }

    const anchorDateTrimmed = anchorDate.trim();
    const anchorTimeTrimmed = anchorTime.trim().slice(0, 5);
    const hasAnchorDate = anchorDateTrimmed.length > 0;
    const hasAnchorTime = anchorTimeTrimmed.length > 0;

    if (hasAnchorDate !== hasAnchorTime) {
      return NextResponse.json(
        {
          success: false,
          error: 'Set both a preferred date and time, or leave both blank.',
        },
        { status: 400 }
      );
    }

    if (hasAnchorDate) {
      if (!isIsoDate(anchorDateTrimmed) || !isTimeHHmm(anchorTimeTrimmed)) {
        return NextResponse.json(
          {
            success: false,
            error: 'Preferred date and time must be valid.',
          },
          { status: 400 }
        );
      }
    }

    const anchorDateForDb = hasAnchorDate ? anchorDateTrimmed : null;
    const anchorTimeForDb = hasAnchorDate ? anchorTimeTrimmed : null;
    const anchorDateInsert = hasAnchorDate
      ? anchorDateTrimmed
      : MAINTENANCE_ANCHOR_PLACEHOLDER_DATE;
    const anchorTimeInsert = hasAnchorDate
      ? anchorTimeTrimmed
      : MAINTENANCE_ANCHOR_PLACEHOLDER_TIME;

    const { data: customerRow, error: customerError } = await supabase
      .from('customers')
      .select('id, email, full_name')
      .eq('id', customerId)
      .eq('business_id', businessId)
      .maybeSingle();

    if (customerError) {
      return NextResponse.json(
        {
          success: false,
          error: customerError.message || 'Failed to load customer',
        },
        { status: 500 }
      );
    }

    if (!customerRow) {
      return NextResponse.json(
        { success: false, error: 'Customer not found for this business' },
        { status: 404 }
      );
    }

    const { data: businessRow, error: businessError } = await supabase
      .from('business_profiles')
      .select('business_name')
      .eq('id', businessId)
      .maybeSingle();

    if (businessError) {
      return NextResponse.json(
        {
          success: false,
          error: businessError.message || 'Failed to load business profile',
        },
        { status: 500 }
      );
    }

    const businessName =
      (
        businessRow as { business_name?: string | null } | null
      )?.business_name?.trim() || 'Your detailer';

    const { data: settingsRow, error: settingsError } = await paymentSettingsOf(
      supabase
    )
      .select('payments_enabled, checkout_mode')
      .eq('business_id', businessId)
      .maybeSingle();

    if (settingsError) {
      return NextResponse.json(
        {
          success: false,
          error: settingsError.message || 'Failed to load payment settings',
        },
        { status: 500 }
      );
    }

    const paymentsEnabled =
      (settingsRow as { payments_enabled?: boolean } | null)
        ?.payments_enabled === true;
    const checkoutMode = checkoutModeFromDb(
      (settingsRow as { checkout_mode?: string | null } | null)?.checkout_mode
    );

    const { data: accountRow, error: accountError } = await paymentAccountsOf(
      supabase
    )
      .select('charges_enabled')
      .eq('business_id', businessId)
      .maybeSingle();

    if (accountError) {
      return NextResponse.json(
        {
          success: false,
          error: accountError.message || 'Failed to load payment account',
        },
        { status: 500 }
      );
    }

    const chargesEnabled =
      (accountRow as { charges_enabled?: boolean } | null)?.charges_enabled ===
      true;

    const ownerPaymentMode = maintenanceOwnerPaymentModeFromCheckout(
      checkoutMode,
      paymentsEnabled,
      chargesEnabled
    );

    const rawToken = crypto.randomBytes(32).toString('base64url');
    const tokenHash = resolveQuoteTokenHash(rawToken);

    if (hasAnchorDate) {
      const slotCheck = await checkMaintenanceAnchorAgainstCalendar(supabase, {
        businessId,
        anchorDate: anchorDateTrimmed,
        anchorTime: anchorTimeTrimmed,
        durationMinutes,
      });
      if (!slotCheck.ok) {
        return NextResponse.json(
          {
            success: false,
            error: maintenanceSlotAvailabilityUserMessage(slotCheck.reason),
          },
          { status: 409 }
        );
      }
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data, error } = await (supabase as any)
      .from('maintenance_enrollments')
      .insert({
        business_id: businessId,
        customer_id: customerId,
        service_name_snapshot: serviceNameSnapshot,
        price_cents: priceCents,
        currency: 'usd',
        duration_minutes: durationMinutes,
        frequency_weeks: frequencyWeeks,
        anchor_date: anchorDateInsert,
        anchor_time: anchorTimeInsert,
        owner_payment_mode: ownerPaymentMode,
        customer_link_token_hash: tokenHash,
        customer_invite_token: rawToken,
      })
      .select('id')
      .single();

    if (error || !data?.id) {
      return NextResponse.json(
        {
          success: false,
          error: error?.message || 'Failed to create maintenance enrollment',
        },
        { status: 500 }
      );
    }

    const enrollmentId = data.id as string;
    const baseUrl = getAppBaseUrl();
    const customerViewUrl = `${baseUrl}${getPublicMaintenanceEnrollmentPath(rawToken)}`;

    const customerEmail = (
      customerRow as { email?: string | null; full_name?: string | null }
    ).email?.trim();
    const customerName =
      (customerRow as { full_name?: string | null }).full_name?.trim() ||
      'there';

    let emailSent = false;
    let emailError: string | null = null;

    if (customerEmail) {
      const sendResult = await sendMaintenanceEnrollmentSentEmail(
        customerEmail,
        {
          customerName,
          businessName,
          serviceName: maintenanceDetailServiceLabel(serviceNameSnapshot),
          priceCents,
          frequencyWeeks,
          durationMinutes,
          anchorDate: anchorDateForDb,
          anchorTime: anchorTimeForDb,
          publicEnrollmentUrl: customerViewUrl,
        }
      );
      emailSent = sendResult.sent;
      emailError = sendResult.sent ? null : sendResult.error;
    } else {
      emailError = 'Customer has no email on file';
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error: updateError } = await (supabase as any)
      .from('maintenance_enrollments')
      .update({
        email_sent_at: emailSent ? new Date().toISOString() : null,
        last_notification_error: emailSent ? null : emailError,
      })
      .eq('id', enrollmentId);

    if (updateError) {
      console.error(
        '[maintenance/enrollments] Failed to update notification fields',
        updateError
      );
    }

    return NextResponse.json(
      {
        success: true,
        data: {
          id: enrollmentId,
          customerViewUrl,
          emailSent,
          ...(emailSent && customerEmail
            ? { notifiedEmail: customerEmail }
            : {}),
          emailError: emailError ?? undefined,
        },
      },
      { status: 201 }
    );
  } catch (err) {
    return NextResponse.json(
      {
        success: false,
        error:
          err instanceof Error
            ? err.message
            : 'Failed to create maintenance enrollment',
      },
      { status: 500 }
    );
  }
}
