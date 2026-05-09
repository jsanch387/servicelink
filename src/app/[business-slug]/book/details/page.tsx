/**
 * Legacy `/book/details` entry — redirects to `/book` with the same query params.
 * Configure + calendar live on a single client funnel on `/[slug]/book`.
 */

import {
  OWNER_MANUAL_BOOKING_FOR,
  getBusinessBookPath,
  getBusinessBookScheduleUrl,
  type BookDetailsStepQuery,
} from '@/constants/routes';
import {
  BOOKING_FLOW_LOCALE_COOKIE_NAME,
  normalizePublicBookingOfferedLocales,
  resolvePublicBookingFlowLocale,
} from '@/libs/bookingFlowLocale';
import { getAvailabilityForBusiness } from '@/features/availability/services/availabilityService';
import { hasAvailabilityConfigured } from '@/features/availability/utils/hasAvailabilityConfigured';
import { isPublicBusinessSlugVisible } from '@/features/business-profile/server/publicBusinessSlugVisibility';
import { getServiceWithAddOnsForBooking } from '@/features/services/api/getServiceWithAddOnsForBooking';
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
    detailsStep?: string;
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
      'id, legacy_request_booking_enabled, public_booking_locales, public_booking_default_locale'
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
  const showNotAcceptingBookings =
    !useAvailabilityBooking &&
    (!legacyRequestBookingEnabled || availabilityConfigured);

  if (showNotAcceptingBookings) {
    redirect(getBusinessBookPath(slug, { lang: bookingFlowLocale }));
  }

  const result = await getServiceWithAddOnsForBooking(
    businessId,
    serviceId.trim()
  );

  if (!result) notFound();

  const { service, addOns, priceOptions } = result;
  const needsPriceStep = service.priceOptionsEnabled && priceOptions.length > 0;

  const initialDetailsStep: BookDetailsStepQuery | undefined =
    detailsStep === 'addons' || detailsStep === 'price'
      ? detailsStep
      : undefined;

  if (!needsPriceStep && addOns.length === 0) {
    redirect(
      getBusinessBookScheduleUrl(slug, {
        serviceId: serviceId.trim(),
        skipDetails: true,
        forOwner: isOwnerManualBooking,
        lang: bookingFlowLocale,
      })
    );
  }

  redirect(
    getBusinessBookScheduleUrl(slug, {
      serviceId: serviceId.trim(),
      addOnIds: addOnIds?.trim(),
      priceOptionId: priceOptionId?.trim(),
      detailsStep: initialDetailsStep,
      forOwner: isOwnerManualBooking,
      lang: bookingFlowLocale,
    })
  );
}
