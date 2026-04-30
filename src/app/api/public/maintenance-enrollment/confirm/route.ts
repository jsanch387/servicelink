/**
 * POST /api/public/maintenance-enrollment/confirm
 *
 * Customer confirms "pay in person" for a maintenance enrollment (magic token link).
 */

import { hasMaintenanceAnchorScheduled } from '@/features/maintenance/server/hasMaintenanceAnchorScheduled';
import { loadPublicMaintenanceEnrollmentByToken } from '@/features/maintenance/server/loadPublicMaintenanceEnrollment';
import {
  maintenanceCustomerPaymentOptions,
  type MaintenanceLivePaymentFlags,
} from '@/features/maintenance/server/maintenancePaymentEligibility';
import { paymentAccountsOf } from '@/features/payments/server/paymentAccountsQuery';
import { paymentSettingsOf } from '@/features/payments/server/paymentSettingsQuery';
import { checkoutModeFromDb } from '@/features/payments/utils/paymentSettingsMaps';
import { ownerHasProAccessForBusiness } from '@/features/pricing/server/ownerHasProAccessForBusiness';
import { createSupabaseAdminClient } from '@/libs/supabase/admin';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as { token?: string };
    const rawToken = typeof body.token === 'string' ? body.token.trim() : '';
    if (!rawToken) {
      return NextResponse.json(
        { success: false, error: 'Link is required.' },
        { status: 400 }
      );
    }

    const supabase = createSupabaseAdminClient();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const db = supabase as any;

    const enrollment = await loadPublicMaintenanceEnrollmentByToken(
      db,
      rawToken
    );
    if (!enrollment) {
      return NextResponse.json(
        { success: false, error: 'This link is invalid.' },
        { status: 404 }
      );
    }

    if (!hasMaintenanceAnchorScheduled(enrollment)) {
      return NextResponse.json(
        {
          success: false,
          error:
            'Choose your first visit date and time on this page before confirming.',
        },
        { status: 400 }
      );
    }

    if (enrollment.status === 'accepted') {
      return NextResponse.json({ success: true, alreadyAccepted: true });
    }

    if (enrollment.status !== 'enrolled_pending_customer') {
      return NextResponse.json(
        {
          success: false,
          error: 'This enrollment can no longer be confirmed here.',
        },
        { status: 409 }
      );
    }

    const businessId = enrollment.business_id;

    const ownerHasPro = await ownerHasProAccessForBusiness(
      supabase,
      businessId
    );

    const { data: settingsRow, error: settingsError } = await paymentSettingsOf(
      supabase
    )
      .select('payments_enabled, checkout_mode')
      .eq('business_id', businessId)
      .maybeSingle();

    if (settingsError) {
      console.error('[maintenance-confirm] payment_settings', settingsError);
      return NextResponse.json(
        { success: false, error: 'Could not load payment settings.' },
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
      console.error('[maintenance-confirm] payment_accounts', accountError);
      return NextResponse.json(
        { success: false, error: 'Could not load payment account.' },
        { status: 500 }
      );
    }

    const chargesEnabled =
      (accountRow as { charges_enabled?: boolean } | null)?.charges_enabled ===
      true;

    const liveFlags: MaintenanceLivePaymentFlags = {
      checkoutMode,
      paymentsEnabled,
      chargesEnabled,
      ownerHasProForPayments: ownerHasPro,
    };

    const { showPayInPerson } = maintenanceCustomerPaymentOptions(liveFlags);
    if (!showPayInPerson) {
      return NextResponse.json(
        {
          success: false,
          error:
            'Pay-in-person confirmation is not available for this business.',
        },
        { status: 403 }
      );
    }

    const nowIso = new Date().toISOString();

    const { error: updateError } = await db
      .from('maintenance_enrollments')
      .update({
        status: 'accepted',
        accepted_at: nowIso,
        payment_status: 'pay_in_person',
        customer_selected_payment: 'in_person',
      })
      .eq('id', enrollment.id)
      .eq('status', 'enrolled_pending_customer');

    if (updateError) {
      console.error('[maintenance-confirm] update failed', updateError);
      return NextResponse.json(
        { success: false, error: 'Could not save confirmation.' },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (e) {
    const message = e instanceof Error ? e.message : 'Unexpected error.';
    console.error('[maintenance-confirm] POST failed', e);
    return NextResponse.json(
      { success: false, error: message },
      { status: 500 }
    );
  }
}
