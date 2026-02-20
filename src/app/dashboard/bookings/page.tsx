/**
 * Bookings Dashboard Page
 *
 * Displays all booking requests for the authenticated user's business.
 * Mobile-first, responsive design.
 */

import { BookingsPageSwitch } from '@/features/availability/booking/dashboard';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';

// Force dynamic rendering (requires authentication)
export const dynamic = 'force-dynamic';

export default async function BookingsPage() {
  // Create server client for SSR
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

  // Get current user
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    redirect('/login');
  }

  // Get the user's business profile
  const { data: businessProfile, error: businessError } = await supabase
    .from('business_profiles')
    .select('id, business_name')
    .eq('profile_id', user.id)
    .single();

  if (businessError || !businessProfile) {
    redirect('/dashboard');
  }

  // Fetch booking requests for this business
  const { data: bookingRequests, error: bookingsError } = await supabase
    .from('booking_requests')
    .select('*')
    .eq('business_id', businessProfile.id)
    .order('submitted_at', { ascending: false });

  if (bookingsError) {
    console.error('Error fetching booking requests:', bookingsError);
  }

  return (
    <BookingsPageSwitch
      businessName={businessProfile.business_name}
      initialBookings={bookingRequests || []}
    />
  );
}
