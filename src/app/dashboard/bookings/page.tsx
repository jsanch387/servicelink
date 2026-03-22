/**
 * Bookings Dashboard Page
 *
 * Renders V1 (booking requests), V2 (availability bookings), or "Turn on availability"
 * based on legacy_request_booking_enabled and business_availability.accept_bookings.
 */

import { BookingsPageSwitch } from '@/features/availability/booking/dashboard/BookingsPageSwitch';
import { parseStoredTimeOffBlocks } from '@/features/availability/types/blockTime';
import { getAvailabilityForBusiness } from '@/features/availability/services/availabilityService';
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
    .select('subscription_tier, subscription_current_period_end')
    .eq('user_id', user.id)
    .maybeSingle();

  const { data: businessProfileRow, error: businessError } = await supabase
    .from('business_profiles')
    .select(
      'id, business_name, business_slug, legacy_request_booking_enabled, free_bookings_month, free_bookings_count'
    )
    .eq('profile_id', user.id)
    .single();

  const businessProfile = businessProfileRow as {
    id: string;
    business_name: string;
    business_slug: string | null;
    legacy_request_booking_enabled: boolean | null;
    free_bookings_month: string | null;
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

  // Derive free bookings used this month from business_profiles,
  // but only for users on the free tier. If the stored month is
  // from a previous month or unset, treat usage as 0.
  let freeBookingsUsed = 0;
  const profile = profileRow as {
    subscription_tier?: string | null;
    subscription_current_period_end?: string | null;
  } | null;
  const isFreeTier = !isProAccess(
    profile?.subscription_tier ?? 'free',
    profile?.subscription_current_period_end ?? null
  );
  if (isFreeTier) {
    const currentMonth = new Date().toISOString().slice(0, 7); // YYYY-MM
    if (businessProfile.free_bookings_month === currentMonth) {
      freeBookingsUsed = businessProfile.free_bookings_count ?? 0;
    }
  }

  return (
    <BookingsPageSwitch
      businessName={businessProfile.business_name}
      businessSlug={businessProfile.business_slug}
      initialBookingRequests={bookingRequests ?? []}
      showRequestBookingFallback={showRequestBookingFallback}
      useAvailabilityBooking={useAvailabilityBooking}
      timeOffBlocks={timeOffBlocks}
      freeBookingsUsed={freeBookingsUsed}
      showFreeBookingsTracker={isFreeTier}
    />
  );
}
