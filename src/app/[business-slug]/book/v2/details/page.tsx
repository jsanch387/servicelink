/**
 * Booking v2 — customer details. The current `/book` flow is unchanged.
 */

import { BookFlowClientRedirect } from '@/features/availability/booking/components/BookFlowClientRedirect';
import { BookingDetailsScreen } from '@/features/booking-v2/components/BookingDetailsScreen';
import { resolvePublicBookingFreeTierGate } from '@/features/availability/booking/server/publicBookingFreeTierCap';
import { getAvailabilityForBusiness } from '@/features/availability/services/availabilityService';
import { hasAvailabilityConfigured } from '@/features/availability/utils/hasAvailabilityConfigured';
import { isPublicBusinessSlugVisible } from '@/features/business-profile/server/publicBusinessSlugVisibility';
import {
  BOOKING_FLOW_LOCALE_COOKIE_NAME,
  normalizePublicBookingOfferedLocales,
  resolvePublicBookingFlowLocale,
} from '@/libs/bookingFlowLocale';
import { getBusinessBookPath } from '@/constants/routes';
import { createSupabaseAdminClient } from '@/libs/supabase/admin';
import type { Metadata } from 'next';
import { cookies } from 'next/headers';
import { unstable_noStore as noStore } from 'next/cache';
import { notFound } from 'next/navigation';

export const dynamic = 'force-dynamic';

interface BookingV2DetailsPageProps {
  params: Promise<{ 'business-slug': string }>;
  searchParams: Promise<{ lang?: string }>;
}

export async function generateMetadata(): Promise<Metadata> {
  return {
    title: 'Book',
    robots: 'noindex, follow',
  };
}

export default async function BookingV2DetailsPage({
  params,
  searchParams,
}: BookingV2DetailsPageProps) {
  noStore();
  const { 'business-slug': slug } = await params;
  const { lang: langParam } = await searchParams;
  const langFromQuery =
    typeof langParam === 'string'
      ? langParam
      : Array.isArray(langParam)
        ? langParam[0]
        : undefined;

  const adminClient = createSupabaseAdminClient();
  if (!(await isPublicBusinessSlugVisible(adminClient, slug))) {
    notFound();
  }

  const { data: profileMeta } = await adminClient
    .from('business_profiles')
    .select(
      'id, legacy_request_booking_enabled, public_booking_locales, public_booking_default_locale, profile_id, free_bookings_count'
    )
    .eq('business_slug', slug)
    .maybeSingle();

  if (!profileMeta) notFound();

  const cookieStore = await cookies();
  const bookingFlowLocale = resolvePublicBookingFlowLocale({
    offeredLocales: normalizePublicBookingOfferedLocales(
      (profileMeta as { public_booking_locales?: string[] | null })
        .public_booking_locales
    ),
    businessDefaultLocale: (
      profileMeta as { public_booking_default_locale?: string | null }
    ).public_booking_default_locale,
    searchParamsLang: langFromQuery,
    cookieValue: cookieStore.get(BOOKING_FLOW_LOCALE_COOKIE_NAME)?.value,
  });

  const businessId = (profileMeta as { id: string }).id;
  const legacyRequestBookingEnabled =
    (profileMeta as { legacy_request_booking_enabled?: boolean | null })
      .legacy_request_booking_enabled === true;
  const availabilityRow = await getAvailabilityForBusiness(
    adminClient,
    businessId
  );
  const useAvailabilityBooking = availabilityRow?.accept_bookings === true;
  const availabilityConfigured = hasAvailabilityConfigured(availabilityRow);
  const meta = profileMeta as {
    profile_id?: string | null;
    free_bookings_count?: number | null;
  };
  const { reachedFreeCap } = await resolvePublicBookingFreeTierGate(
    adminClient,
    {
      profileId: meta.profile_id ?? null,
      freeBookingsCount: meta.free_bookings_count ?? null,
    }
  );
  const showNotAcceptingBookings =
    (!useAvailabilityBooking &&
      (!legacyRequestBookingEnabled || availabilityConfigured)) ||
    reachedFreeCap;

  if (showNotAcceptingBookings) {
    return (
      <BookFlowClientRedirect
        href={getBusinessBookPath(slug, { lang: bookingFlowLocale })}
      />
    );
  }

  return (
    <BookingDetailsScreen
      businessSlug={slug}
      bookingFlowLocale={bookingFlowLocale}
    />
  );
}
