/**
 * POST /api/payments/servicelink/enable
 *
 * Creates `payment_settings` (if missing) and sets `payments_enabled` true
 * after Stripe Connect is complete. Requires Pro.
 *
 * Supabase: add boolean column if missing:
 *   alter table payment_settings add column if not exists payments_enabled boolean not null default false;
 */

import { getHasProAccessForPayments } from '@/features/payments/server/getHasProAccessForPayments';
import { paymentAccountsOf } from '@/features/payments/server/paymentAccountsQuery';
import { paymentSettingsOf } from '@/features/payments/server/paymentSettingsQuery';
import { createSupabaseServerClient } from '@/libs/supabase/server';
import { resolveCurrentBusinessId } from '@/server/resolveCurrentBusinessId';
import { NextResponse } from 'next/server';

const DEFAULT_DEPOSIT_TYPE = 'percent';
const DEFAULT_CURRENCY = 'usd';

export async function POST() {
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
          error: 'Finish Stripe setup before turning on ServiceLink payments.',
        },
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

    if (existing?.id) {
      const { error: updateError } = await paymentSettingsOf(supabase)
        .update({
          payments_enabled: true,
          payment_account_id: account.id,
          updated_by: user.id,
        })
        .eq('business_id', businessId);

      if (updateError) {
        return NextResponse.json(
          { success: false, error: updateError.message },
          { status: 500 }
        );
      }
    } else {
      const { error: insertError } = await paymentSettingsOf(supabase).insert({
        business_id: businessId,
        payment_account_id: account.id,
        payments_enabled: true,
        checkout_mode: null,
        deposits_enabled: false,
        deposit_type: DEFAULT_DEPOSIT_TYPE,
        deposit_value: 0,
        collect_remaining_balance: true,
        currency: DEFAULT_CURRENCY,
        updated_by: user.id,
      });

      if (insertError) {
        return NextResponse.json(
          { success: false, error: insertError.message },
          { status: 500 }
        );
      }
    }

    return NextResponse.json({ success: true });
  } catch (e) {
    const message = e instanceof Error ? e.message : 'Unexpected error';
    console.error('POST /api/payments/servicelink/enable', e);
    return NextResponse.json(
      { success: false, error: message },
      { status: 500 }
    );
  }
}
