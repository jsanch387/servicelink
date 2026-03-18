/**
 * Booking Request Page
 *
 * Handles URLs like: myservicelink.app/johns-plumbing/book
 * Displays the booking request form for a specific business
 */

import { getAvailabilityForBusiness } from '@/features/availability/services/availabilityService';
import { hasAvailabilityConfigured } from '@/features/availability/utils/hasAvailabilityConfigured';
import { getAddOnsByIdsForBooking } from '@/features/services/api/getAddOnsByIdsForBooking';
import { isProAccess } from '@/features/pricing';
import { createSupabaseAdminClient } from '@/libs/supabase/admin';
import { isVehicleRelatedBusinessType } from '@/constants/businessTypes';
import { ArrowLeftIcon } from '@heroicons/react/24/outline';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import { BookFlowSwitch } from './BookFlowSwitch';

// Force dynamic rendering
export const dynamic = 'force-dynamic';

interface BookingRequestPageProps {
  params: Promise<{
    'business-slug': string;
  }>;
  searchParams: Promise<{
    serviceId?: string;
    addOnIds?: string;
    skipDetails?: string;
  }>;
}

type PublicBusinessProfileForBooking = {
  id: string;
  business_name: string;
  business_slug: string | null;
  business_type: string | null;
  legacy_request_booking_enabled: boolean | null;
  profile_id: string | null;
  free_bookings_month: string | null;
  free_bookings_count: number | null;
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
    const supabase = createSupabaseAdminClient();

    const { data: profileData, error } = await supabase
      .from('business_profiles')
      .select(
        'id, business_name, business_slug, business_type, legacy_request_booking_enabled, profile_id, free_bookings_month, free_bookings_count'
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
    const supabase = createSupabaseAdminClient();

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

export async function generateMetadata({
  params,
}: {
  params: Promise<{ 'business-slug': string }>;
}): Promise<Metadata> {
  const { 'business-slug': slug } = await params;
  const siteUrl = (
    process.env.NEXT_PUBLIC_SITE_URL || 'https://myservicelink.app'
  ).replace(/\/$/, '');

  const canonicalUrl = `${siteUrl}/${slug}`;

  return {
    title: `Book | ServiceLink`,
    robots: 'noindex, follow',
    alternates: {
      canonical: canonicalUrl,
    },
  };
}

export default async function BookingRequestPage({
  params,
  searchParams,
}: BookingRequestPageProps) {
  const { 'business-slug': slug } = await params;
  const { serviceId, addOnIds, skipDetails } = await searchParams;

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
  const availabilityConfigured = hasAvailabilityConfigured(availabilityRow);

  // Free-tier cap: if this owner is on the free tier and has already used
  // all 5 bookings for the current month, treat as not accepting bookings
  // so we don't show the calendar/form at all.
  let reachedFreeCap = false;
  if (businessProfile.profile_id) {
    const { data: ownerProfileRaw } = await adminClient
      .from('profiles')
      .select('subscription_tier, subscription_current_period_end')
      .eq('user_id', businessProfile.profile_id)
      .maybeSingle();

    const ownerProfile: {
      subscription_tier?: string | null;
      subscription_current_period_end?: string | null;
    } | null = ownerProfileRaw as {
      subscription_tier?: string | null;
      subscription_current_period_end?: string | null;
    } | null;

    const hasPro = isProAccess(
      ownerProfile?.subscription_tier,
      ownerProfile?.subscription_current_period_end
    );
    const isFreeTier = !hasPro;
    if (isFreeTier) {
      const currentMonth = new Date().toISOString().slice(0, 7); // YYYY-MM
      const storedMonth = businessProfile.free_bookings_month;
      const count = businessProfile.free_bookings_count ?? 0;

      if (storedMonth === currentMonth && count >= 5) {
        reachedFreeCap = true;
      }
    }
  } else {
    // Legacy data without profile_id: fall back purely on the stored month/count.
    const currentMonth = new Date().toISOString().slice(0, 7); // YYYY-MM
    const storedMonth = businessProfile.free_bookings_month;
    const count = businessProfile.free_bookings_count ?? 0;
    if (storedMonth === currentMonth && count >= 5) {
      reachedFreeCap = true;
    }
  }

  // If they've set availability and toggle off, don't fall back to legacy request booking.
  // Also, if they've hit the free plan cap, show the \"not accepting\" message immediately.
  const showNotAcceptingBookings =
    (!useAvailabilityBooking &&
      (!legacyRequestBookingEnabled || availabilityConfigured)) ||
    reachedFreeCap;

  // When the free-plan cap is reached, force the UI into the \"not accepting\"
  // state even if availability booking is technically on.
  const effectiveUseAvailabilityBooking =
    useAvailabilityBooking && !reachedFreeCap;

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

  // Fetch add-ons when addOnIds present (resolves IDs to full objects for display)
  const addonIdList = addOnIds?.trim()
    ? addOnIds

        .split(',')
        .map(s => s.trim())
        .filter(Boolean)
    : [];
  const selectedAddOns =
    addonIdList.length > 0
      ? await getAddOnsByIdsForBooking(businessProfile.id, addonIdList)
      : [];

  const showVehicleFields = isVehicleRelatedBusinessType(
    businessProfile.business_type
  );

  return (
    <div className="min-h-screen bg-[var(--dashboard-bg)]">
      {/* Header with Back Button */}
      <div className="sticky top-0 z-10 bg-[var(--dashboard-bg)]/95 backdrop-blur-sm border-b border-white/10">
        <div className="max-w-2xl mx-auto px-4 sm:px-6 py-4">
          <Link
            href={
              serviceId?.trim() && !skipDetails
                ? `/${slug}/book/details?serviceId=${encodeURIComponent(serviceId.trim())}${addOnIds?.trim() ? `&addOnIds=${encodeURIComponent(addOnIds.trim())}` : ''}`
                : `/${slug}`
            }
            className="inline-flex items-center gap-2 text-gray-400 hover:text-white transition-colors"
          >
            <ArrowLeftIcon className="h-5 w-5" />
            <span className="text-sm font-medium">
              {serviceId?.trim() && !skipDetails
                ? 'Back to service'
                : 'Back to profile'}
            </span>
          </Link>
        </div>
      </div>

      {/* Form Container – availability booking or request booking by flag */}
      <div className="max-w-2xl mx-auto px-4 sm:px-6 pt-6 pb-16 sm:pt-8 sm:pb-24">
        <BookFlowSwitch
          useAvailabilityBooking={effectiveUseAvailabilityBooking}
          showNotAcceptingBookings={showNotAcceptingBookings}
          businessName={businessProfile.business_name}
          businessId={businessProfile.id}
          businessSlug={businessProfile.business_slug || slug}
          showVehicleFields={showVehicleFields}
          serviceId={serviceId?.trim() ?? undefined}
          addOnIds={addOnIds?.trim() || undefined}
          selectedAddOns={selectedAddOns}
          serviceName={serviceName}
          servicePrice={serviceDetails?.price ?? undefined}
          serviceDurationMinutes={serviceDurationMinutes}
          weeklySchedule={weeklySchedule}
        />
      </div>
    </div>
  );
}
