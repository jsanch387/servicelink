/**
 * Bookings Dashboard Page
 *
 * Renders V1 (booking requests), V2 (availability bookings), or "Turn on availability"
 * based on legacy_request_booking_enabled and business_availability.accept_bookings.
 */

import { BookingsPageSwitch } from '@/features/availability/booking/dashboard/BookingsPageSwitch';
import { getAvailabilityForBusiness } from '@/features/availability/services/availabilityService';
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

  const { data: businessProfileRow, error: businessError } = await supabase
    .from('business_profiles')
    .select('id, business_name, legacy_request_booking_enabled')
    .eq('profile_id', user.id)
    .single();

  const businessProfile = businessProfileRow as {
    id: string;
    business_name: string;
    legacy_request_booking_enabled: boolean | null;
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

  // V1 only: fetch booking requests when legacy and V2 off. V2 list is fetched client-side.
  const { data: bookingRequests, error: requestsError } = await supabase
    .from('booking_requests')
    .select('*')
    .eq('business_id', businessProfile.id)
    .order('submitted_at', { ascending: false });

  if (requestsError) {
    console.error('Error fetching booking requests:', requestsError);
  }

  return (
    <BookingsPageSwitch
      businessName={businessProfile.business_name}
      initialBookingRequests={bookingRequests ?? []}
      legacyRequestBookingEnabled={legacyRequestBookingEnabled}
      useAvailabilityBooking={useAvailabilityBooking}
    />
  );
}
