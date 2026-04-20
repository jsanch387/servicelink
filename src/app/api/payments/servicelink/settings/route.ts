/**
 * PATCH /api/payments/servicelink/settings
 *
 * Owner updates `payment_settings` for the current business (checkout mode,
 * deposits, or turning ServiceLink payments off). Requires Pro and a
 * `payment_settings` row (created when payments were first enabled).
 */

import { getHasProAccessForPayments } from '@/features/payments/server/getHasProAccessForPayments';
import { paymentAccountsOf } from '@/features/payments/server/paymentAccountsQuery';
import { paymentSettingsOf } from '@/features/payments/server/paymentSettingsQuery';
import type { CheckoutPaymentMode } from '@/features/payments/types/checkoutPaymentMode';
import { createSupabaseServerClient } from '@/libs/supabase/server';
import { resolveCurrentBusinessId } from '@/server/resolveCurrentBusinessId';
import { NextRequest, NextResponse } from 'next/server';

const CHECKOUT_MODES: readonly CheckoutPaymentMode[] = [
  'in_person',
  'in_app',
  'customer_choice',
] as const;

function isCheckoutMode(v: unknown): v is CheckoutPaymentMode {
  return (
    typeof v === 'string' && (CHECKOUT_MODES as readonly string[]).includes(v)
  );
}

export async function PATCH(request: NextRequest) {
  try {
    const supabase = await createSupabaseServerClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user?.id) {
      return NextResponse.json(
        { success: false, error: 'Authentication required' },
        { status: 401 }
      );
    }

    const hasPro = await getHasProAccessForPayments(supabase, user.id);
    if (!hasPro) {
      return NextResponse.json(
        { success: false, error: 'Pro subscription required' },
        { status: 403 }
      );
    }

    const businessResolved = await resolveCurrentBusinessId(supabase);
    if (!businessResolved.ok) {
      return NextResponse.json(
        { success: false, error: businessResolved.error },
        { status: businessResolved.status }
      );
    }

    const businessId = businessResolved.businessId;

    let body: unknown;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json(
        { success: false, error: 'Invalid JSON body' },
        { status: 400 }
      );
    }

    const raw = body as Record<string, unknown>;
    const paymentsEnabled = raw.paymentsEnabled;
    const checkoutMode = raw.checkoutMode;
    const depositsEnabled = raw.depositsEnabled;
    const depositType = raw.depositType;
    const depositValue = raw.depositValue;

    const patch: Record<string, unknown> = {
      updated_by: user.id,
    };

    if (typeof paymentsEnabled === 'boolean') {
      if (paymentsEnabled === true) {
        const { data: account, error: accountError } = await paymentAccountsOf(
          supabase
        )
          .select('id, onboarding_status, charges_enabled')
          .eq('business_id', businessId)
          .maybeSingle();

        if (accountError) {
          return NextResponse.json(
            { success: false, error: accountError.message },
            { status: 500 }
          );
        }

        if (
          !account ||
          account.onboarding_status !== 'complete' ||
          !account.charges_enabled
        ) {
          return NextResponse.json(
            {
              success: false,
              error:
                'Finish Stripe setup before turning on ServiceLink payments.',
            },
            { status: 400 }
          );
        }

        patch.payments_enabled = true;
        patch.payment_account_id = account.id;
      } else {
        patch.payments_enabled = false;
      }
    }

    if (checkoutMode !== undefined) {
      if (checkoutMode === null) {
        patch.checkout_mode = null;
      } else if (isCheckoutMode(checkoutMode)) {
        patch.checkout_mode = checkoutMode;
      } else {
        return NextResponse.json(
          { success: false, error: 'Invalid checkoutMode' },
          { status: 400 }
        );
      }
    }

    if (typeof depositsEnabled === 'boolean') {
      patch.deposits_enabled = depositsEnabled;
    }

    const depositAmountUpdate =
      depositType !== undefined || depositValue !== undefined;
    if (depositAmountUpdate) {
      if (depositType !== 'fixed' && depositType !== 'percent') {
        return NextResponse.json(
          { success: false, error: 'depositType must be fixed or percent' },
          { status: 400 }
        );
      }
      if (typeof depositValue !== 'number' || !Number.isFinite(depositValue)) {
        return NextResponse.json(
          { success: false, error: 'depositValue must be a finite number' },
          { status: 400 }
        );
      }
      if (depositType === 'percent') {
        const p = Math.round(depositValue);
        if (p < 0 || p > 100) {
          return NextResponse.json(
            { success: false, error: 'Percent deposit must be 0–100' },
            { status: 400 }
          );
        }
        patch.deposit_type = 'percent';
        patch.deposit_value = p;
      } else {
        const cents = Math.round(depositValue);
        if (cents < 0) {
          return NextResponse.json(
            { success: false, error: 'Fixed deposit must be non-negative' },
            { status: 400 }
          );
        }
        patch.deposit_type = 'fixed';
        patch.deposit_value = cents;
      }
    }

    const keys = Object.keys(patch).filter(k => k !== 'updated_by');
    if (keys.length === 0) {
      return NextResponse.json(
        { success: false, error: 'No valid fields to update' },
        { status: 400 }
      );
    }

    const { data: existing, error: existingError } = await paymentSettingsOf(
      supabase
    )
      .select('id')
      .eq('business_id', businessId)
      .maybeSingle();

    if (existingError) {
      return NextResponse.json(
        { success: false, error: existingError.message },
        { status: 500 }
      );
    }

    if (!existing?.id) {
      return NextResponse.json(
        {
          success: false,
          error: 'Payment settings not found. Turn on payments first.',
        },
        { status: 404 }
      );
    }

    const { error: updateError } = await paymentSettingsOf(supabase)
      .update(patch)
      .eq('business_id', businessId);

    if (updateError) {
      return NextResponse.json(
        { success: false, error: updateError.message },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (e) {
    const message = e instanceof Error ? e.message : 'Unexpected error';
    console.error('PATCH /api/payments/servicelink/settings', e);
    return NextResponse.json(
      { success: false, error: message },
      { status: 500 }
    );
  }
}
