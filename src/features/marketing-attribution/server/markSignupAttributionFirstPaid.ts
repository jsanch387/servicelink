/**
 * Write-once first paid Pro conversion on `signup_attribution`.
 * Best-effort — never blocks checkout or subscription sync.
 *
 * "First paid" matches the welcome-email rule: Pro + `active` + a Stripe
 * subscription id (trials stay unstamped until they convert).
 *
 * If no attribution row exists, insert channel `unknown` (signed_up_at =
 * profile created_at) and set first_paid_at. Never overwrite an existing
 * first_paid_at. Meta Subscribe fires only when this call newly stamps.
 */

import { sendMetaCapiEvent } from '@/features/analytics/server/sendMetaCapiEvent';
import { subscribeEventId } from '@/features/analytics/utils/metaPixel';
import type { SupabaseClient } from '@supabase/supabase-js';
import { toSignupAttributionRow } from './parseMarketingAttribution';

export type MarkSignupAttributionFirstPaidParams = {
  userId?: string;
  stripeSubscriptionId?: string;
};

export type MarkSignupAttributionFirstPaidResult = {
  stamped: boolean;
  skippedReason?: string;
  error?: string;
};

type ProfilePaidRow = {
  user_id: string;
  created_at: string | null;
  subscription_tier: string | null;
  subscription_status: string | null;
  stripe_subscription_id: string | null;
};

type AttributionStampRow = {
  user_id: string;
  first_paid_at: string | null;
};

function isPaidActivePro(row: ProfilePaidRow): boolean {
  const tier = (row.subscription_tier ?? '').trim().toLowerCase();
  const status = (row.subscription_status ?? '').trim().toLowerCase();
  const hasSubscription = Boolean(row.stripe_subscription_id?.trim());
  return tier === 'pro' && status === 'active' && hasSubscription;
}

async function fireSubscribe(userId: string): Promise<void> {
  try {
    await sendMetaCapiEvent({
      eventName: 'Subscribe',
      eventId: subscribeEventId(userId),
      eventSourceUrl: 'https://myservicelink.app/dashboard/settings',
      userId,
    });
  } catch (error) {
    console.error('[MarketingAttribution] CAPI Subscribe', error);
  }
}

async function stampExistingRow(
  supabase: SupabaseClient,
  userId: string,
  stampedAt: string
): Promise<{ stamped: boolean; error?: string }> {
  const { data: claimed, error: stampError } = await supabase
    .from('signup_attribution')
    .update({ first_paid_at: stampedAt })
    .eq('user_id', userId)
    .is('first_paid_at', null)
    .select('user_id');

  if (stampError) {
    return { stamped: false, error: stampError.message };
  }
  return { stamped: Boolean(claimed?.length) };
}

export async function markSignupAttributionFirstPaid(
  supabase: SupabaseClient,
  params: MarkSignupAttributionFirstPaidParams
): Promise<MarkSignupAttributionFirstPaidResult> {
  const userIdInput = params.userId?.trim();
  const subIdInput = params.stripeSubscriptionId?.trim();
  if (!userIdInput && !subIdInput) {
    return {
      stamped: false,
      error: 'userId or stripeSubscriptionId is required',
    };
  }

  const profilesQuery = supabase
    .from('profiles')
    .select(
      'user_id, created_at, subscription_tier, subscription_status, stripe_subscription_id'
    );
  const { data: row, error: loadError } = await (
    userIdInput
      ? profilesQuery.eq('user_id', userIdInput)
      : profilesQuery.eq('stripe_subscription_id', subIdInput)
  ).maybeSingle();

  if (loadError) {
    return { stamped: false, error: loadError.message };
  }
  if (!row) {
    return { stamped: false, skippedReason: 'no_profile' };
  }

  const profile = row as ProfilePaidRow;
  const userId = profile.user_id?.trim() || userIdInput || '';
  if (!userId) {
    return { stamped: false, skippedReason: 'no_user_id' };
  }

  if (!isPaidActivePro(profile)) {
    return { stamped: false, skippedReason: 'not_paid_active_pro' };
  }

  const stampedAt = new Date().toISOString();
  const updated = await stampExistingRow(supabase, userId, stampedAt);
  if (updated.error) {
    return { stamped: false, error: updated.error };
  }
  if (updated.stamped) {
    await fireSubscribe(userId);
    return { stamped: true };
  }

  const { data: existing, error: existingError } = await supabase
    .from('signup_attribution')
    .select('user_id, first_paid_at')
    .eq('user_id', userId)
    .maybeSingle();

  if (existingError) {
    return { stamped: false, error: existingError.message };
  }

  const existingRow = existing as AttributionStampRow | null;
  if (existingRow?.first_paid_at) {
    return { stamped: false, skippedReason: 'already_stamped' };
  }
  if (existingRow) {
    const retry = await stampExistingRow(supabase, userId, stampedAt);
    if (retry.error) return { stamped: false, error: retry.error };
    if (retry.stamped) {
      await fireSubscribe(userId);
      return { stamped: true };
    }
    return { stamped: false, skippedReason: 'already_stamped' };
  }

  const signedUpAt = profile.created_at?.trim() || stampedAt;
  const { error: insertError } = await supabase
    .from('signup_attribution')
    .insert({
      user_id: userId,
      ...toSignupAttributionRow(undefined),
      signed_up_at: signedUpAt,
      first_paid_at: stampedAt,
    } as never);

  if (insertError) {
    if (insertError.code === '23505') {
      const retry = await stampExistingRow(supabase, userId, stampedAt);
      if (retry.error) return { stamped: false, error: retry.error };
      if (retry.stamped) {
        await fireSubscribe(userId);
        return { stamped: true };
      }
      return { stamped: false, skippedReason: 'already_stamped' };
    }
    return { stamped: false, error: insertError.message };
  }

  await fireSubscribe(userId);
  return { stamped: true };
}
