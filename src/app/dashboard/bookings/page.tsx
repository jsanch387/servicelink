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
import { requireDashboardPageAccess } from '@/features/team/server/requireDashboardPageAccess';
import { redirect } from 'next/navigation';

export const dynamic = 'force-dynamic';

export default async function BookingsPage() {
  const { supabase, context } =
    await requireDashboardPageAccess('bookings.read');

  const { data: businessProfileRow, error: businessError } = await supabase
    .from('business_profiles')
    .select(
      'id, business_name, business_slug, legacy_request_booking_enabled, free_bookings_count'
    )
    .eq('id', context.businessId)
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
  const bufferTime = availabilityRow?.buffer_time ?? 'none';
  const showRequestBookingFallback =
    legacyRequestBookingEnabled && !availabilityConfigured;

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
      businessSlug={businessProfile.business_slug}
      initialBookingRequests={bookingRequests ?? []}
      showRequestBookingFallback={showRequestBookingFallback}
      useAvailabilityBooking={useAvailabilityBooking}
      weeklySchedule={weeklySchedule}
      bufferTime={bufferTime}
      timeOffBlocks={timeOffBlocks}
      freeBookingsUsed={0}
      showFreeBookingsTracker={false}
    />
  );
}
