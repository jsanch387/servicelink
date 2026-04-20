/**
 * Service Details page (price options if enabled, then add-ons, then calendar).
 * Fetches service, active price options, and assigned add-ons.
 * Redirects straight to /book when there is nothing to configure here.
 */

import {
  OWNER_MANUAL_BOOKING_FOR,
  getBusinessBookPath,
} from '@/constants/routes';
import { getAvailabilityForBusiness } from '@/features/availability/services/availabilityService';
import { hasAvailabilityConfigured } from '@/features/availability/utils/hasAvailabilityConfigured';
import { getServiceWithAddOnsForBooking } from '@/features/services/api/getServiceWithAddOnsForBooking';
import { ServiceDetailsScreen } from '@/features/services/booking-flow';
import { createSupabaseAdminClient } from '@/libs/supabase/admin';
import type { Metadata } from 'next';
import { unstable_noStore as noStore } from 'next/cache';
import { notFound, redirect } from 'next/navigation';

export const dynamic = 'force-dynamic';

interface ServiceDetailsPageProps {
  params: Promise<{ 'business-slug': string }>;
  searchParams: Promise<{
    serviceId?: string;
    addOnIds?: string;
    priceOptionId?: string;
    /** `price` | `addons` — restores sub-step when returning from calendar. */
    detailsStep?: string;
    for?: string;
  }>;
}

async function fetchBusinessIdBySlug(slug: string): Promise<string | null> {
  const supabase = createSupabaseAdminClient();
  const { data } = await supabase
    .from('business_profiles')
    .select('id')
    .eq('business_slug', slug)
    .single();
  return (data as { id: string } | null)?.id ?? null;
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
  } = await searchParams;
  const isOwnerManualBooking = bookingForParam === OWNER_MANUAL_BOOKING_FOR;

  // Missing serviceId: redirect to book page so user can pick a service (avoids 404 from shared links/bookmarks that dropped query params)
  if (!serviceId?.trim()) {
    redirect(
      isOwnerManualBooking
        ? getBusinessBookPath(slug, { forOwner: true })
        : `/${slug}/book`
    );
  }

  const businessId = await fetchBusinessIdBySlug(slug);
  if (!businessId) notFound();

  const adminClient = createSupabaseAdminClient();
  const [profileRow, availabilityRow] = await Promise.all([
    adminClient
      .from('business_profiles')
      .select('legacy_request_booking_enabled')
      .eq('id', businessId)
      .single(),
    getAvailabilityForBusiness(adminClient, businessId),
  ]);

  const legacyRequestBookingEnabled =
    (profileRow.data as { legacy_request_booking_enabled?: boolean } | null)
      ?.legacy_request_booking_enabled === true;
  const useAvailabilityBooking = availabilityRow?.accept_bookings === true;
  const availabilityConfigured = hasAvailabilityConfigured(availabilityRow);
  const showNotAcceptingBookings =
    !useAvailabilityBooking &&
    (!legacyRequestBookingEnabled || availabilityConfigured);

  if (showNotAcceptingBookings) {
    redirect(`/${slug}/book`);
  }

  const result = await getServiceWithAddOnsForBooking(
    businessId,
    serviceId.trim()
  );

  if (!result) notFound();

  const { service, addOns, priceOptions } = result;

  const needsPriceStep = service.priceOptionsEnabled && priceOptions.length > 0;

  // No add-ons and no price choice needed: skip details and go straight to date selection
  if (!needsPriceStep && addOns.length === 0) {
    const q = new URLSearchParams({
      serviceId: serviceId.trim(),
      skipDetails: '1',
    });
    if (isOwnerManualBooking) {
      q.set('for', OWNER_MANUAL_BOOKING_FOR);
    }
    redirect(`/${slug}/book?${q.toString()}`);
  }

  const initialAddOnIds = addOnIds?.trim()
    ? addOnIds
        .split(',')
        .map(s => s.trim())
        .filter(Boolean)
    : undefined;

  const initialDetailsStep =
    detailsStep === 'addons' || detailsStep === 'price'
      ? detailsStep
      : undefined;

  return (
    <div className="min-h-screen bg-[var(--dashboard-bg)]">
      <ServiceDetailsScreen
        businessSlug={slug}
        serviceId={serviceId.trim()}
        service={service}
        addOns={addOns}
        priceOptions={priceOptions}
        initialAddOnIds={initialAddOnIds}
        initialPriceOptionId={priceOptionId?.trim()}
        initialDetailsStep={initialDetailsStep}
        isOwnerManualBooking={isOwnerManualBooking}
      />
    </div>
  );
}
