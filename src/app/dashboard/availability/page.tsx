/**
 * Availability Dashboard Page
 *
 * Lets business owners set working hours and accept-bookings toggle.
 * Feature is gated by AVAILABILITY_FEATURE_ENABLED.
 */

import { AVAILABILITY_FEATURE_ENABLED } from '@/features/availability/constants';
import { AvailabilityContent } from '@/features/availability';
import { createSupabaseServerClient } from '@/libs/supabase/server';
import { redirect } from 'next/navigation';

export const dynamic = 'force-dynamic';

export default async function AvailabilityPage() {
  if (!AVAILABILITY_FEATURE_ENABLED) {
    redirect('/dashboard');
  }

  const supabase = await createSupabaseServerClient();

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    redirect('/login');
  }

  return <AvailabilityContent />;
}
