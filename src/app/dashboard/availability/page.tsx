/**
 * Availability Dashboard Page
 *
 * Lets business owners set working hours and accept-bookings toggle.
 * Feature is gated by AVAILABILITY_FEATURE_ENABLED.
 */

import { AVAILABILITY_FEATURE_ENABLED } from '@/features/availability/constants';
import { AvailabilityContent } from '@/features/availability';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';

export const dynamic = 'force-dynamic';

export default async function AvailabilityPage() {
  if (!AVAILABILITY_FEATURE_ENABLED) {
    redirect('/dashboard');
  }

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

  return <AvailabilityContent />;
}
