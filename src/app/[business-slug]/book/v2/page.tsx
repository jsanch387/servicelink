/**
 * Booking v2 — set up one service (pricing, add-ons, vehicle).
 * The current `/book/details` flow is unchanged.
 */

import { BookFlowClientRedirect } from '@/features/availability/booking/components/BookFlowClientRedirect';
import { BookingV2ServiceList } from '@/features/booking-v2/components/BookingV2ServiceList';
import { bookingV2AssetKind } from '@/features/booking-v2/bookingV2AssetKind';
import { ServiceSetupScreen } from '@/features/booking-v2/components/ServiceSetupScreen';
import { loadBookingV2ServiceChoices } from '@/features/booking-v2/server/loadBookingV2ServiceChoices';
import { resolvePublicBookingFreeTierGate } from '@/features/availability/booking/server/publicBookingFreeTierCap';
import { getAvailabilityForBusiness } from '@/features/availability/services/availabilityService';
import { hasAvailabilityConfigured } from '@/features/availability/utils/hasAvailabilityConfigured';
import { isPublicBusinessSlugVisible } from '@/features/business-profile/server/publicBusinessSlugVisibility';
import { loadPublicActiveSale } from '@/features/marketing/server/loadPublicActiveSale';
import { ownerHasProAccessForBusiness } from '@/features/pricing/server/ownerHasProAccessForBusiness';
import { getServiceWithAddOnsForBooking } from '@/features/services/api/getServiceWithAddOnsForBooking';
import {
  BOOKING_FLOW_LOCALE_COOKIE_NAME,
  normalizePublicBookingOfferedLocales,
  resolvePublicBookingFlowLocale,
} from '@/libs/bookingFlowLocale';
import {
  getBusinessBookPath,
  getPublicBusinessProfilePath,
} from '@/constants/routes';
import { createSupabaseAdminClient } from '@/libs/supabase/admin';
import type { Metadata } from 'next';
import { cookies } from 'next/headers';
import { unstable_noStore as noStore } from 'next/cache';
import { notFound } from 'next/navigation';

export const dynamic = 'force-dynamic';

interface BookingV2PageProps {
  params: Promise<{ 'business-slug': string }>;
  searchParams: Promise<{
    serviceId?: string;
    lang?: string;
    add?: string;
    edit?: string;
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

  return {
    title: 'Book',
    robots: 'noindex, follow',
    alternates: { canonical: `${siteUrl}/${slug}` },
  };
}

export default async function BookingV2Page({
  params,
  searchParams,
}: BookingV2PageProps) {
  noStore();
  const { 'business-slug': slug } = await params;
  const {
    serviceId,
    lang: langParam,
    add: addParam,
    edit: editParam,
  } = await searchParams;
  const addingService = addParam === '1' || addParam === 'true';
  const editIndex = parseEditIndex(editParam);
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
      'id, business_type, legacy_request_booking_enabled, public_booking_locales, public_booking_default_locale, profile_id, free_bookings_count'
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
  const profileHref = getPublicBusinessProfilePath(slug, {
    lang: bookingFlowLocale,
  });

  if (!serviceId?.trim() && !addingService) {
    return <BookFlowClientRedirect href={profileHref} />;
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
    return (
      <BookFlowClientRedirect
        href={getBusinessBookPath(slug, { lang: bookingFlowLocale })}
      />
    );
  }

  const ownerHasPro = await ownerHasProAccessForBusiness(
    adminClient,
    businessId
  );
  const sale = await loadPublicActiveSale(adminClient, businessId, {
    ownerHasPro,
  });

  if (!serviceId?.trim()) {
    const choices = await loadBookingV2ServiceChoices(
      adminClient,
      businessId,
      bookingFlowLocale,
      ownerHasPro
    );
    return (
      <BookingV2ServiceList
        businessSlug={slug}
        bookingFlowLocale={bookingFlowLocale}
        services={choices.services}
        categories={choices.categories}
        sale={sale}
      />
    );
  }

  const result = await getServiceWithAddOnsForBooking(
    businessId,
    serviceId.trim(),
    bookingFlowLocale
  );

  if (!result) notFound();

  return (
    <ServiceSetupScreen
      businessSlug={slug}
      bookingFlowLocale={bookingFlowLocale}
      service={result.service}
      priceOptions={result.priceOptions}
      addOns={result.addOns}
      sale={sale}
      assetKind={bookingV2AssetKind(
        (profileMeta as { business_type?: string | null }).business_type
      )}
      intent={editIndex != null ? 'edit' : addingService ? 'add' : 'new'}
      editIndex={editIndex}
    />
  );
}

function parseEditIndex(value: string | undefined): number | null {
  if (!value || !/^\d+$/.test(value)) return null;
  const index = Number(value);
  return Number.isInteger(index) ? index : null;
}
