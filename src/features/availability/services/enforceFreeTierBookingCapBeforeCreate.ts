/**
 * Free-tier V2 booking cap (5 lifetime per business on Free).
 * - Public booking flow: check + increment before insert.
 * - Quote approval: check before insert; increment only after the quote is linked to the booking
 *   so losing a link race does not consume a slot or leave stray counts.
 */

import {
  FREE_BOOKINGS_LIMIT,
  isExemptFromFreeTierLifetimeBookingCap,
} from '@/features/pricing';
import type { Database } from '@/libs/supabase/client';
import type { SupabaseClient } from '@supabase/supabase-js';

export type BusinessProfileRowForBookingCap = {
  id: string;
  profile_id: string | null;
  free_bookings_month: string | null;
  free_bookings_count: number | null;
};

export type FreeTierBookingCapResult =
  | { ok: true }
  | { ok: false; message: string };

type CapContext =
  | { applies: false }
  | {
      applies: true;
      atCap: boolean;
      nextCount: number;
      businessId: string;
    };

async function resolveFreeTierCapContext(
  supabase: SupabaseClient<Database>,
  profile: BusinessProfileRowForBookingCap
): Promise<CapContext> {
  const profileId = profile.profile_id ?? null;
  if (!profileId) {
    return { applies: false };
  }

  const { data: ownerProfileRaw } = await supabase
    .from('profiles')
    .select(
      'subscription_tier, subscription_current_period_end, subscription_status, stripe_subscription_id, stripe_customer_id'
    )
    .eq('user_id', profileId)
    .maybeSingle();

  const ownerProfile = ownerProfileRaw as {
    subscription_tier?: string | null;
    subscription_current_period_end?: string | null;
    subscription_status?: string | null;
    stripe_subscription_id?: string | null;
    stripe_customer_id?: string | null;
  } | null;

  const subjectToFreeTierBookingCap = !isExemptFromFreeTierLifetimeBookingCap(
    ownerProfile?.subscription_tier,
    ownerProfile?.subscription_current_period_end,
    ownerProfile?.subscription_status,
    ownerProfile?.stripe_subscription_id,
    ownerProfile?.stripe_customer_id
  );

  if (!subjectToFreeTierBookingCap) {
    return { applies: false };
  }

  const count = profile.free_bookings_count ?? 0;

  return {
    applies: true,
    atCap: count >= FREE_BOOKINGS_LIMIT,
    nextCount: count + 1,
    businessId: profile.id,
  };
}

async function persistFreeTierIncrement(
  supabase: SupabaseClient<Database>,
  ctx: Extract<CapContext, { applies: true }>
): Promise<void> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  await (supabase as any)

    .from('business_profiles')
    .update({
      free_bookings_count: ctx.nextCount,
    })
    .eq('id', ctx.businessId);
}

/**
 * Check only (no DB writes). Use before creating a booking when increment will happen later.
 */
export async function checkFreeTierBookingCapAllowsCreate(
  supabase: SupabaseClient<Database>,
  profile: BusinessProfileRowForBookingCap
): Promise<FreeTierBookingCapResult> {
  const ctx = await resolveFreeTierCapContext(supabase, profile);
  if (!ctx.applies) {
    return { ok: true };
  }
  if (ctx.atCap) {
    return {
      ok: false,
      message:
        "This business isn't accepting new bookings right now. They've reached the limit for their current plan.",
    };
  }
  return { ok: true };
}

/**
 * Re-fetch profile counters, then increment if still on free tier. Safe after a successful booking.
 */
export async function persistFreeTierBookingIncrementAfterBooking(
  supabase: SupabaseClient<Database>,
  businessId: string
): Promise<void> {
  const { data: profileRaw } = await supabase
    .from('business_profiles')
    .select('id, profile_id, free_bookings_month, free_bookings_count')
    .eq('id', businessId)
    .maybeSingle();

  const profile = profileRaw as BusinessProfileRowForBookingCap | null;
  if (!profile) {
    return;
  }

  const ctx = await resolveFreeTierCapContext(supabase, profile);
  if (!ctx.applies || ctx.atCap) {
    return;
  }

  await persistFreeTierIncrement(supabase, ctx);
}

/**
 * If the owner is on the free tier and at the lifetime cap, returns `ok: false`.
 * Otherwise increments `free_bookings_count` when applicable.
 */
export async function enforceFreeTierBookingCapBeforeCreate(
  supabase: SupabaseClient<Database>,
  profile: BusinessProfileRowForBookingCap
): Promise<FreeTierBookingCapResult> {
  const ctx = await resolveFreeTierCapContext(supabase, profile);
  if (!ctx.applies) {
    return { ok: true };
  }
  if (ctx.atCap) {
    return {
      ok: false,
      message:
        "This business isn't accepting new bookings right now. They've reached the limit for their current plan.",
    };
  }

  await persistFreeTierIncrement(supabase, ctx);
  return { ok: true };
}
