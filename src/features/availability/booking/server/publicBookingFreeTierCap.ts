import {
  FREE_BOOKINGS_LIMIT,
  isExemptFromFreeTierLifetimeBookingCap,
} from '@/features/pricing';
import type { Database } from '@/libs/supabase/client';
import type { SupabaseClient } from '@supabase/supabase-js';

export type PublicBookingFreeTierGate = {
  /** Free tier + lifetime booking count at cap (blocks new public bookings). */
  reachedFreeCap: boolean;
  /**
   * Pro-style public booking (no free cap, price options): {@link isExemptFromFreeTierLifetimeBookingCap}.
   * Broader than dashboard `isProAccess` so billing hiccups do not lock the book flow.
   */
  ownerHasPro: boolean;
};

/**
 * One `profiles` read: free-tier lifetime booking cap + Pro-style public booking UX.
 */
export async function resolvePublicBookingFreeTierGate(
  supabase: SupabaseClient<Database>,
  params: {
    profileId: string | null;
    freeBookingsCount: number | null;
  }
): Promise<PublicBookingFreeTierGate> {
  const count = params.freeBookingsCount ?? 0;

  if (!params.profileId) {
    return {
      reachedFreeCap: count >= FREE_BOOKINGS_LIMIT,
      ownerHasPro: false,
    };
  }

  const { data: ownerProfileRaw } = await supabase
    .from('profiles')
    .select(
      'subscription_tier, subscription_current_period_end, subscription_status, stripe_subscription_id, stripe_customer_id'
    )
    .eq('user_id', params.profileId)
    .maybeSingle();

  const ownerProfile = ownerProfileRaw as {
    subscription_tier?: string | null;
    subscription_current_period_end?: string | null;
    subscription_status?: string | null;
    stripe_subscription_id?: string | null;
    stripe_customer_id?: string | null;
  } | null;

  const ownerHasPro = isExemptFromFreeTierLifetimeBookingCap(
    ownerProfile?.subscription_tier,
    ownerProfile?.subscription_current_period_end,
    ownerProfile?.subscription_status,
    ownerProfile?.stripe_subscription_id,
    ownerProfile?.stripe_customer_id
  );

  return {
    reachedFreeCap: !ownerHasPro && count >= FREE_BOOKINGS_LIMIT,
    ownerHasPro,
  };
}
