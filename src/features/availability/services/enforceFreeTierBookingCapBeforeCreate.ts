/**
 * Free-tier lifetime booking cap: `FREE_BOOKINGS_LIMIT` appointments per business
 * while the owner is not Pro (`isProAccess` / {@link isExemptFromFreeTierLifetimeBookingCap}).
 * Cancel, past_due, unpaid, paused, or never-subscribed all count as Free.
 * Uses `business_profiles.free_bookings_count` only (`free_bookings_month` is unused).
 * - Public / owner create: check + increment before insert. Increment failure blocks create.
 * - Quote approval: check before insert; increment only after the quote is linked.
 */

import {
  FREE_BOOKINGS_LIMIT,
  isExemptFromFreeTierLifetimeBookingCap,
} from '@/features/pricing';
import type { Database } from '@/libs/supabase/client';
import type { SupabaseClient } from '@supabase/supabase-js';

/** Rows passed into cap checks / increments (counter only; cap is lifetime). */
export type BusinessProfileRowForBookingCap = {
  id: string;
  profile_id: string | null;
  free_bookings_count: number | null;
};

export type FreeTierBookingCapResult =
  | { ok: true }
  | { ok: false; message: string };

export const FREE_TIER_BOOKING_CAP_REACHED_MESSAGE =
  "This business isn't accepting new bookings right now. They've reached the limit for their current plan.";

const FREE_TIER_BOOKING_CAP_INCREMENT_FAILED_MESSAGE =
  "Couldn't create this booking. Please try again.";

type CapContext = {
  applies: true;
  atCap: boolean;
  nextCount: number;
  businessId: string;
};

function capFromCount(
  businessId: string,
  freeBookingsCount: number | null
): CapContext {
  const count = freeBookingsCount ?? 0;
  return {
    applies: true,
    atCap: count >= FREE_BOOKINGS_LIMIT,
    nextCount: count + 1,
    businessId,
  };
}

async function resolveFreeTierCapContext(
  supabase: SupabaseClient<Database>,
  profile: BusinessProfileRowForBookingCap
): Promise<CapContext | { applies: false }> {
  const profileId = profile.profile_id ?? null;
  if (!profileId) {
    return capFromCount(profile.id, profile.free_bookings_count);
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

  return capFromCount(profile.id, profile.free_bookings_count);
}

async function persistFreeTierIncrement(
  supabase: SupabaseClient<Database>,
  ctx: CapContext
): Promise<boolean> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error } = await (supabase as any)
    .from('business_profiles')
    .update({
      free_bookings_count: ctx.nextCount,
    })
    .eq('id', ctx.businessId);

  if (error) {
    console.error('[free-tier-cap] increment_failed', {
      businessId: ctx.businessId,
      nextCount: ctx.nextCount,
      code: error.code ?? 'unknown',
      message: String(error.message ?? '').slice(0, 160),
    });
    return false;
  }
  return true;
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
      message: FREE_TIER_BOOKING_CAP_REACHED_MESSAGE,
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
    .select('id, profile_id, free_bookings_count')
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
 * If the owner is subject to the free-tier cap and at the lifetime limit, returns `ok: false`.
 * Otherwise increments `free_bookings_count`.
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
      message: FREE_TIER_BOOKING_CAP_REACHED_MESSAGE,
    };
  }

  const wrote = await persistFreeTierIncrement(supabase, ctx);
  if (!wrote) {
    return {
      ok: false,
      message: FREE_TIER_BOOKING_CAP_INCREMENT_FAILED_MESSAGE,
    };
  }
  return { ok: true };
}
