import { createSupabaseAdminClient } from '@/libs/supabase/admin';
import type { PaidConversionPeriod, PaidConversionReport } from '../types';
import {
  buildPaidConversionReport,
  signedUpAtCutoffIso,
  type AttributionConversionInput,
} from '../utils/paidConversion';

const ATTRIBUTION_SELECT =
  'user_id, channel, utm_campaign, utm_source, utm_medium, signed_up_at, first_paid_at';

const PROFILE_SELECT =
  'user_id, subscription_tier, subscription_status, subscription_current_period_end, stripe_subscription_id, stripe_customer_id';

type AttributionLoadRow = {
  user_id: string;
  channel: string | null;
  utm_campaign: string | null;
  utm_source: string | null;
  utm_medium: string | null;
  signed_up_at: string;
  first_paid_at: string | null;
};

type ProfileLoadRow = {
  user_id: string;
  subscription_tier: string | null;
  subscription_status: string | null;
  subscription_current_period_end: string | null;
  stripe_subscription_id: string | null;
  stripe_customer_id: string | null;
};

export async function loadPaidConversionReport(
  period: PaidConversionPeriod
): Promise<PaidConversionReport> {
  const admin = createSupabaseAdminClient();
  const cutoff = signedUpAtCutoffIso(period);

  let attributionQuery = admin
    .from('signup_attribution')
    .select(ATTRIBUTION_SELECT)
    .order('signed_up_at', { ascending: false });
  if (cutoff) {
    attributionQuery = attributionQuery.gte('signed_up_at', cutoff);
  }

  const { data: attributionRows, error: attributionError } =
    await attributionQuery;
  if (attributionError) {
    throw new Error(attributionError.message);
  }

  const attribution = (attributionRows ?? []) as AttributionLoadRow[];
  const userIds = [
    ...new Set(attribution.map(row => row.user_id).filter(Boolean)),
  ];

  const profilesByUserId = new Map<string, ProfileLoadRow>();
  if (userIds.length > 0) {
    const { data: profileRows, error: profileError } = await admin
      .from('profiles')
      .select(PROFILE_SELECT)
      .in('user_id', userIds);
    if (profileError) {
      throw new Error(profileError.message);
    }
    for (const row of (profileRows ?? []) as ProfileLoadRow[]) {
      profilesByUserId.set(row.user_id, row);
    }
  }

  const joined: AttributionConversionInput[] = attribution.map(row => {
    const profile = profilesByUserId.get(row.user_id);
    return {
      channel: row.channel,
      utm_campaign: row.utm_campaign,
      utm_source: row.utm_source,
      utm_medium: row.utm_medium,
      signed_up_at: row.signed_up_at,
      first_paid_at: row.first_paid_at,
      subscription_tier: profile?.subscription_tier,
      subscription_status: profile?.subscription_status,
      subscription_current_period_end: profile?.subscription_current_period_end,
      stripe_subscription_id: profile?.stripe_subscription_id,
      stripe_customer_id: profile?.stripe_customer_id,
    };
  });

  return buildPaidConversionReport(joined, period);
}
