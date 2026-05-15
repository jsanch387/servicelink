/**
 * Bookings Dashboard Page
 *
 * Renders V1 (booking requests), V2 (availability bookings), or "Turn on availability"
 * based on legacy_request_booking_enabled and business_availability.accept_bookings.
 */

import { BookingsPageSwitch } from '@/features/availability/booking/dashboard/BookingsPageSwitch';
import { getAvailabilityForBusiness } from '@/features/availability/services/availabilityService';
import { parseStoredTimeOffBlocks } from '@/features/availability/types/blockTime';
import {
  DEFAULT_SCHEDULE,
  type WeeklySchedule,
} from '@/features/availability/types/availability';
import { hasAvailabilityConfigured } from '@/features/availability/utils/hasAvailabilityConfigured';
import { isProAccess } from '@/features/pricing';
import { createSupabaseServerClient } from '@/libs/supabase/server';
import { redirect } from 'next/navigation';

export const dynamic = 'force-dynamic';

export default async function BookingsPage() {
  const supabase = await createSupabaseServerClient();

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    redirect('/login');
  }

  const { data: profileRow } = await supabase
    .from('profiles')
    .select(
      'subscription_tier, subscription_current_period_end, subscription_status, stripe_subscription_id, stripe_customer_id'
    )
    .eq('user_id', user.id)
    .maybeSingle();

  const { data: businessProfileRow, error: businessError } = await supabase
    .from('business_profiles')
    .select(
      'id, business_name, business_slug, legacy_request_booking_enabled, free_bookings_count'
    )
    .eq('profile_id', user.id)
    .single();

  const businessProfile = businessProfileRow as {
    id: string;
    business_name: string;
    business_slug: string | null;
    legacy_request_booking_enabled: boolean | null;
    free_bookings_count: number | null;
  } | null;

  if (businessError || !businessProfile) {
    redirect('/dashboard');
  }

  const legacyRequestBookingEnabled =
    businessProfile.legacy_request_booking_enabled === true;
  const availabilityRow = await getAvailabilityForBusiness(
    supabase,
    businessProfile.id
  );
  const useAvailabilityBooking = availabilityRow?.accept_bookings === true;
  const availabilityConfigured = hasAvailabilityConfigured(availabilityRow);
  const timeOffBlocks = parseStoredTimeOffBlocks(
    availabilityRow?.time_off_blocks
  );
  const weeklySchedule =
    (availabilityRow?.weekly_schedule as WeeklySchedule | null) ??
    DEFAULT_SCHEDULE;
  // Legacy request booking only when legacy user has NOT set availability; once set, no fallback
  const showRequestBookingFallback =
    legacyRequestBookingEnabled && !availabilityConfigured;

  // V1 only: fetch booking requests when legacy and V2 off. V2 list is fetched client-side.
  const { data: bookingRequests, error: requestsError } = await supabase
    .from('booking_requests')
    .select('*')
    .eq('business_id', businessProfile.id)
    .order('submitted_at', { ascending: false });

  if (requestsError) {
    console.error('Error fetching booking requests:', requestsError);
  }

  // Free tier: lifetime cap from business_profiles.free_bookings_count.
  let freeBookingsUsed = 0;
  const profile = profileRow as {
    subscription_tier?: string | null;
    subscription_current_period_end?: string | null;
    subscription_status?: string | null;
    stripe_subscription_id?: string | null;
    stripe_customer_id?: string | null;
  } | null;
  const isFreeTier = !isProAccess(
    profile?.subscription_tier ?? 'free',
    profile?.subscription_current_period_end ?? null,
    profile?.subscription_status,
    profile?.stripe_subscription_id,
    profile?.stripe_customer_id
  );
  if (isFreeTier) {
    freeBookingsUsed = businessProfile.free_bookings_count ?? 0;
  }

  return (
    <BookingsPageSwitch
      businessName={businessProfile.business_name}
      businessSlug={businessProfile.business_slug}
      initialBookingRequests={bookingRequests ?? []}
      showRequestBookingFallback={showRequestBookingFallback}
      useAvailabilityBooking={useAvailabilityBooking}
      weeklySchedule={weeklySchedule}
      timeOffBlocks={timeOffBlocks}
      freeBookingsUsed={freeBookingsUsed}
      showFreeBookingsTracker={isFreeTier}
    />
  );
}
