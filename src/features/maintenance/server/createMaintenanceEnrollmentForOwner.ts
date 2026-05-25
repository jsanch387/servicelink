import { getPublicMaintenanceEnrollmentPath } from '@/constants/routes';
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
import { logMaintenanceEnrollmentPost } from '@/features/maintenance/server/maintenanceEnrollmentRouteLog';
import { maintenanceOwnerPaymentModeFromCheckout } from '@/features/maintenance/server/maintenanceOwnerPaymentMode';
import type { ParsedMaintenanceEnrollmentBody } from '@/features/maintenance/server/parseMaintenanceEnrollmentBody';
import { maintenanceDetailServiceLabel } from '@/features/maintenance/utils/maintenanceDetailServiceLabel';
import { paymentAccountsOf } from '@/features/payments/server/paymentAccountsQuery';
import { paymentSettingsOf } from '@/features/payments/server/paymentSettingsQuery';
import { checkoutModeFromDb } from '@/features/payments/utils/paymentSettingsMaps';
import { resolveQuoteTokenHash } from '@/features/quotes/shared/utils/resolveQuoteTokenHash';
import type { Database } from '@/libs/supabase/client';
import type { SupabaseClient } from '@supabase/supabase-js';
import crypto from 'crypto';

export type CreateMaintenanceEnrollmentFailReason =
  | 'customer_load_failed'
  | 'customer_not_found'
  | 'pending_check_failed'
  | 'pending_invite_exists'
  | 'business_load_failed'
  | 'payment_settings_failed'
  | 'payment_account_failed'
  | 'slot_unavailable'
  | 'insert_failed';

export type CreateMaintenanceEnrollmentForOwnerResult =
  | {
      ok: true;
      enrollmentId: string;
      customerViewUrl: string;
      emailSent: boolean;
      notifiedEmail?: string;
      emailError?: string | null;
    }
  | {
      ok: false;
      error: string;
      status: number;
      logReason: CreateMaintenanceEnrollmentFailReason;
      supabaseCode?: string;
    };

export async function createMaintenanceEnrollmentForOwner(params: {
  supabase: SupabaseClient<Database>;
  businessId: string;
  body: ParsedMaintenanceEnrollmentBody;
  requestId?: string;
}): Promise<CreateMaintenanceEnrollmentForOwnerResult> {
  const { supabase, businessId, body, requestId } = params;
  const {
    customerId,
    serviceNameSnapshot,
    priceCents,
    durationMinutes,
    hasAnchorDate,
    anchorDateTrimmed,
    anchorTimeTrimmed,
  } = body;

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
    return {
      ok: false,
      error: customerError.message || 'Failed to load customer',
      status: 500,
      logReason: 'customer_load_failed',
      supabaseCode: customerError.code,
    };
  }

  if (!customerRow) {
    return {
      ok: false,
      error: 'Customer not found for this business',
      status: 404,
      logReason: 'customer_not_found',
    };
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const db = supabase as any;

  const { data: pendingRow, error: pendingError } = await db
    .from('maintenance_enrollments')
    .select('id, status, customer_invite_token')
    .eq('business_id', businessId)
    .eq('customer_id', customerId)
    .eq('status', 'enrolled_pending_customer')
    .not('customer_invite_token', 'is', null)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  if (pendingError) {
    return {
      ok: false,
      error: pendingError.message || 'Failed to check existing invites',
      status: 500,
      logReason: 'pending_check_failed',
      supabaseCode: pendingError.code,
    };
  }

  if (pendingRow?.id) {
    return {
      ok: false,
      error:
        'This customer already has a pending maintenance invite. View details to copy the link or wait until they respond.',
      status: 409,
      logReason: 'pending_invite_exists',
    };
  }

  const { data: businessRow, error: businessError } = await supabase
    .from('business_profiles')
    .select('business_name')
    .eq('id', businessId)
    .maybeSingle();

  if (businessError) {
    return {
      ok: false,
      error: businessError.message || 'Failed to load business profile',
      status: 500,
      logReason: 'business_load_failed',
      supabaseCode: businessError.code,
    };
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
    return {
      ok: false,
      error: settingsError.message || 'Failed to load payment settings',
      status: 500,
      logReason: 'payment_settings_failed',
      supabaseCode: settingsError.code,
    };
  }

  const paymentsEnabled =
    (settingsRow as { payments_enabled?: boolean } | null)?.payments_enabled ===
    true;
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
    return {
      ok: false,
      error: accountError.message || 'Failed to load payment account',
      status: 500,
      logReason: 'payment_account_failed',
      supabaseCode: accountError.code,
    };
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
      return {
        ok: false,
        error: maintenanceSlotAvailabilityUserMessage(slotCheck.reason),
        status: 409,
        logReason: 'slot_unavailable',
      };
    }
  }

  const { data, error } = await db
    .from('maintenance_enrollments')
    .insert({
      business_id: businessId,
      customer_id: customerId,
      service_name_snapshot: serviceNameSnapshot,
      price_cents: priceCents,
      currency: 'usd',
      duration_minutes: durationMinutes,
      frequency_weeks: 0,
      anchor_date: anchorDateInsert,
      anchor_time: anchorTimeInsert,
      owner_payment_mode: ownerPaymentMode,
      customer_link_token_hash: tokenHash,
      customer_invite_token: rawToken,
    })
    .select('id')
    .single();

  if (error || !data?.id) {
    return {
      ok: false,
      error: error?.message || 'Failed to create maintenance enrollment',
      status: 500,
      logReason: 'insert_failed',
      supabaseCode: error?.code,
    };
  }

  const enrollmentId = data.id as string;
  const baseUrl = getAppBaseUrl();
  const customerViewUrl = `${baseUrl}${getPublicMaintenanceEnrollmentPath(rawToken)}`;

  const customerEmail = (
    customerRow as { email?: string | null; full_name?: string | null }
  ).email?.trim();
  const customerName =
    (customerRow as { full_name?: string | null }).full_name?.trim() || 'there';

  let emailSent = false;
  let emailError: string | null = null;

  if (customerEmail) {
    const sendResult = await sendMaintenanceEnrollmentSentEmail(customerEmail, {
      customerName,
      businessName,
      serviceName: maintenanceDetailServiceLabel(serviceNameSnapshot),
      priceCents,
      durationMinutes,
      anchorDate: anchorDateForDb,
      anchorTime: anchorTimeForDb,
      publicEnrollmentUrl: customerViewUrl,
    });
    emailSent = sendResult.sent;
    emailError = sendResult.sent ? null : sendResult.error;
  } else {
    emailError = 'Customer has no email on file';
  }

  const { error: updateError } = await db
    .from('maintenance_enrollments')
    .update({
      email_sent_at: emailSent ? new Date().toISOString() : null,
      last_notification_error: emailSent ? null : emailError,
    })
    .eq('id', enrollmentId);

  if (updateError) {
    if (requestId) {
      logMaintenanceEnrollmentPost(
        requestId,
        'warn',
        'notification_update_failed',
        {
          supabaseCode: updateError.code,
        }
      );
    } else {
      console.warn(
        '[maintenance-enrollment] FAIL notification_update_failed',
        updateError.code ?? updateError.message
      );
    }
  }

  return {
    ok: true,
    enrollmentId,
    customerViewUrl,
    emailSent,
    ...(emailSent && customerEmail ? { notifiedEmail: customerEmail } : {}),
    emailError,
  };
}
