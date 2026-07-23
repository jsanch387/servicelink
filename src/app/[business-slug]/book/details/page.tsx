/**
 * Service Details page (price options if enabled, then add-ons, then
 * mobile/shop when the business offers both, then calendar).
 * Fetches service, active price options, and assigned add-ons.
 * Redirects straight to /book when there is nothing to configure here.
 */

import {
  OWNER_MANUAL_BOOKING_FOR,
  getBusinessBookPath,
  getBusinessBookScheduleUrl,
  parseBookServiceLocationTypeQuery,
} from '@/constants/routes';
import {
  BOOKING_FLOW_LOCALE_COOKIE_NAME,
  normalizePublicBookingOfferedLocales,
  resolvePublicBookingFlowLocale,
} from '@/libs/bookingFlowLocale';
import { resolvePublicBookingFreeTierGate } from '@/features/availability/booking/server/publicBookingFreeTierCap';
import { getAvailabilityForBusiness } from '@/features/availability/services/availabilityService';
import { hasAvailabilityConfigured } from '@/features/availability/utils/hasAvailabilityConfigured';
import { isPublicBusinessSlugVisible } from '@/features/business-profile/server/publicBusinessSlugVisibility';
import { buildPublicBookingServiceLocation } from '@/features/business-profile/utils/publicServiceLocation';
import { getServiceWithAddOnsForBooking } from '@/features/services/api/getServiceWithAddOnsForBooking';
import { ServiceDetailsScreen } from '@/features/services/booking-flow';
import { BookFlowClientRedirect } from '@/features/availability/booking/components/BookFlowClientRedirect';
import { createSupabaseAdminClient } from '@/libs/supabase/admin';
import type { Metadata } from 'next';
import { cookies } from 'next/headers';
import { unstable_noStore as noStore } from 'next/cache';
import { notFound, redirect } from 'next/navigation';

export const dynamic = 'force-dynamic';

interface ServiceDetailsPageProps {
  params: Promise<{ 'business-slug': string }>;
  searchParams: Promise<{
    serviceId?: string;
    addOnIds?: string;
    priceOptionId?: string;
    /** `price` | `addons` | `location` — restores sub-step when returning from calendar. */
    detailsStep?: string;
    /** `mobile` | `shop` — restores location choice when returning from calendar. */
    serviceLocationType?: string;
    for?: string;
    lang?: string;
  }>;
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
    title: `Book Details | ServiceLink`,
    robots: 'noindex, follow',
    alternates: {
      canonical: canonicalUrl,
    },
  };
}

export default async function ServiceDetailsPage({
  params,
  searchParams,
}: ServiceDetailsPageProps) {
  noStore();
  const { 'business-slug': slug } = await params;
  const {
    serviceId,
    addOnIds,
    priceOptionId,
    detailsStep,
    serviceLocationType: serviceLocationTypeRaw,
    for: bookingForParam,
    lang: langParam,
  } = await searchParams;
  const isOwnerManualBooking = bookingForParam === OWNER_MANUAL_BOOKING_FOR;

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
      'id, legacy_request_booking_enabled, public_booking_locales, public_booking_default_locale, profile_id, free_bookings_count, service_location_mode, service_area, business_zip, shop_street_address, shop_unit'
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

  // Missing serviceId: redirect to book page so user can pick a service (avoids 404 from shared links/bookmarks that dropped query params)
  if (!serviceId?.trim()) {
    redirect(
      isOwnerManualBooking
        ? getBusinessBookPath(slug, {
            forOwner: true,
            lang: bookingFlowLocale,
          })
        : getBusinessBookPath(slug, { lang: bookingFlowLocale })
    );
  }

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
    redirect(
      getBusinessBookPath(slug, {
        forOwner: isOwnerManualBooking,
        lang: bookingFlowLocale,
      })
    );
  }

  const result = await getServiceWithAddOnsForBooking(
    businessId,
    serviceId.trim()
  );

  if (!result) notFound();

  const { service, addOns, priceOptions } = result;

  const serviceLocation = buildPublicBookingServiceLocation(
    profileMeta as Parameters<typeof buildPublicBookingServiceLocation>[0]
  );
  const needsPriceStep = service.priceOptionsEnabled && priceOptions.length > 0;
  const needsLocationStep = serviceLocation.mode === 'both';

  // Nothing to configure (no price options, add-ons, or mobile/shop choice)
  if (!needsPriceStep && addOns.length === 0 && !needsLocationStep) {
    return (
      <BookFlowClientRedirect
        href={getBusinessBookScheduleUrl(slug, {
          serviceId: serviceId.trim(),
          skipDetails: true,
          forOwner: isOwnerManualBooking,
          lang: bookingFlowLocale,
        })}
      />
    );
  }

  const initialAddOnIds = addOnIds?.trim()
    ? addOnIds
        .split(',')
        .map(s => s.trim())
        .filter(Boolean)
    : undefined;

  const initialDetailsStep =
    detailsStep === 'addons' ||
    detailsStep === 'price' ||
    detailsStep === 'location'
      ? detailsStep
      : undefined;

  const initialServiceLocationType = parseBookServiceLocationTypeQuery(
    serviceLocationTypeRaw
  );

  return (
    <>
      <ServiceDetailsScreen
        businessSlug={slug}
        serviceId={serviceId.trim()}
        service={service}
        addOns={addOns}
        priceOptions={priceOptions}
        serviceLocation={serviceLocation}
        initialAddOnIds={initialAddOnIds}
        initialPriceOptionId={priceOptionId?.trim()}
        initialDetailsStep={initialDetailsStep}
        initialServiceLocationType={initialServiceLocationType}
        isOwnerManualBooking={isOwnerManualBooking}
        bookingFlowLocale={bookingFlowLocale}
      />
    </>
  );
}
