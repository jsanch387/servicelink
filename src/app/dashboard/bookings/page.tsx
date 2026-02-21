/**
 * Bookings Dashboard Page
 *
 * Renders either V1 (booking requests) or V2 (availability bookings) based on
 * the business "Accept Bookings" toggle. V1 data is fetched here; V2 view
 * fetches its own data via GET /api/availability/bookings so the two flows stay separate.
 */

import { BookingsPageSwitch } from '@/features/availability/booking/dashboard/BookingsPageSwitch';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';

export const dynamic = 'force-dynamic';

export default async function BookingsPage() {
  const cookieStore = await cookies();
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value;
        },
      },
    }
  );

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    redirect('/login');
  }

  const { data: businessProfile, error: businessError } = await supabase
    .from('business_profiles')
    .select('id, business_name')
    .eq('profile_id', user.id)
    .single();

  if (businessError || !businessProfile) {
    redirect('/dashboard');
  }

  // V1 only: fetch booking requests. V2 list is fetched client-side by AvailabilityBookingsView.
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
    />
  );
}
