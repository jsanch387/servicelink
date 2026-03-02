/**
 * Booking Request Page
 *
 * Handles URLs like: myservicelink.app/johns-plumbing/book
 * Displays the booking request form for a specific business
 */

import { getAvailabilityForBusiness } from '@/features/availability/services/availabilityService';
import { createSupabaseAdminClient } from '@/libs/supabase/admin';
import { createSupabaseServerClient } from '@/libs/supabase/server';
import { ArrowLeftIcon } from '@heroicons/react/24/outline';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { BookFlowSwitch } from './BookFlowSwitch';

// Force dynamic rendering
export const dynamic = 'force-dynamic';

interface BookingRequestPageProps {
  params: Promise<{
    'business-slug': string;
  }>;
  searchParams: Promise<{
    serviceId?: string;
  }>;
}

type PublicBusinessProfileForBooking = {
  id: string;
  business_name: string;
  business_slug: string | null;
  legacy_request_booking_enabled: boolean | null;
  [key: string]: unknown;
};

type PublicServiceForBooking = {
  name: string;
  price_cents: number | null;
  hours_to_complete: number | null;
  duration_minutes: number | null;
};

async function fetchBusinessProfileBySlug(slug: string) {
  try {
    const supabase = await createSupabaseServerClient();

    const { data: profileData, error } = await supabase
      .from('business_profiles')
      .select(
        'id, business_name, business_slug, legacy_request_booking_enabled'
      )
      .eq('business_slug', slug)
      .single();

    if (error || !profileData) {
      return null;
    }

    return profileData as PublicBusinessProfileForBooking;
  } catch (error) {
    console.error('Error fetching business profile:', error);
    return null;
  }
}

async function fetchServiceById(
  businessId: string,
  serviceId: string
): Promise<{
  name: string;
  price: number;
  hours_to_complete: number | null;
  duration_minutes: number | null;
} | null> {
  try {
    const supabase = await createSupabaseServerClient();

    const { data: serviceData, error } = await supabase
      .from('business_services')
      .select('name, price_cents, hours_to_complete, duration_minutes')
      .eq('id', serviceId)
      .eq('business_id', businessId)
      .eq('is_active', true)
      .single();

    if (error || !serviceData) {
      return null;
    }

    const service = serviceData as PublicServiceForBooking;

    return {
      name: service.name,
      price: service.price_cents || 0,
      hours_to_complete: service.hours_to_complete ?? null,
      duration_minutes: service.duration_minutes ?? null,
    };
  } catch (error) {
    console.error('Error fetching service by id:', error);
    return null;
  }
}

export default async function BookingRequestPage({
  params,
  searchParams,
}: BookingRequestPageProps) {
  const { 'business-slug': slug } = await params;
  const { serviceId } = await searchParams;

  // Fetch the business profile by slug
  const businessProfile = await fetchBusinessProfileBySlug(slug);

  // If profile not found, show 404
  if (!businessProfile) {
    notFound();
  }

  // Fetch availability with admin client so RLS doesn't block (public page needs to read accept_bookings)
  const adminClient = createSupabaseAdminClient();
  const availabilityRow = await getAvailabilityForBusiness(
    adminClient,
    businessProfile.id
  );
  const useAvailabilityBooking = availabilityRow?.accept_bookings === true;
  const weeklySchedule = availabilityRow?.weekly_schedule ?? null;
  const legacyRequestBookingEnabled =
    businessProfile.legacy_request_booking_enabled === true;
  const showNotAcceptingBookings =
    !legacyRequestBookingEnabled && !useAvailabilityBooking;

  // Fetch service by ID when present (validates business_id)
  const serviceDetails =
    serviceId && serviceId.trim()
      ? await fetchServiceById(businessProfile.id, serviceId.trim())
      : null;
  const serviceName = serviceDetails?.name ?? '';
  const serviceDurationMinutes =
    serviceDetails?.duration_minutes != null
      ? Math.max(15, serviceDetails.duration_minutes)
      : serviceDetails?.hours_to_complete != null
        ? Math.max(15, Math.round(serviceDetails.hours_to_complete * 60))
        : 60;

  return (
    <div className="min-h-screen bg-[var(--dashboard-bg)]">
      {/* Header with Back Button */}
      <div className="sticky top-0 z-10 bg-[var(--dashboard-bg)]/95 backdrop-blur-sm border-b border-white/10">
        <div className="max-w-2xl mx-auto px-4 sm:px-6 py-4">
          <Link
            href={`/${slug}`}
            className="inline-flex items-center gap-2 text-gray-400 hover:text-white transition-colors"
          >
            <ArrowLeftIcon className="h-5 w-5" />
            <span className="text-sm font-medium">Back to profile</span>
          </Link>
        </div>
      </div>

      {/* Form Container – availability booking or request booking by flag */}
      <div className="max-w-2xl mx-auto px-4 sm:px-6 pt-6 pb-16 sm:pt-8 sm:pb-24">
        <BookFlowSwitch
          useAvailabilityBooking={useAvailabilityBooking}
          showNotAcceptingBookings={showNotAcceptingBookings}
          businessName={businessProfile.business_name}
          businessId={businessProfile.id}
          businessSlug={businessProfile.business_slug || slug}
          serviceId={serviceId?.trim() ?? undefined}
          serviceName={serviceName}
          servicePrice={serviceDetails?.price ?? undefined}
          serviceDurationMinutes={serviceDurationMinutes}
          weeklySchedule={weeklySchedule}
        />
      </div>
    </div>
  );
}
