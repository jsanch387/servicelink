/**
 * Service Details page (add-ons step before calendar).
 * Fetches real service + assigned add-ons. If service has no add-ons, redirects to date selection.
 */

import { hasAvailabilityConfigured } from '@/features/availability/utils/hasAvailabilityConfigured';
import { getAvailabilityForBusiness } from '@/features/availability/services/availabilityService';
import { getServiceWithAddOnsForBooking } from '@/features/services/api/getServiceWithAddOnsForBooking';
import { ServiceDetailsScreen } from '@/features/services/booking-flow';
import {
  OWNER_MANUAL_BOOKING_FOR,
  getBusinessBookPath,
} from '@/constants/routes';
import { createSupabaseAdminClient } from '@/libs/supabase/admin';
import { ArrowLeftIcon } from '@heroicons/react/24/outline';
import Link from 'next/link';
import { redirect, notFound } from 'next/navigation';
import type { Metadata } from 'next';

export const dynamic = 'force-dynamic';

interface ServiceDetailsPageProps {
  params: Promise<{ 'business-slug': string }>;
  searchParams: Promise<{
    serviceId?: string;
    addOnIds?: string;
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
  const { 'business-slug': slug } = await params;
  const { serviceId, addOnIds, for: bookingForParam } = await searchParams;
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

  const { service, addOns } = result;

  // No add-ons: skip details and go straight to date selection (skipDetails tells book page: back = profile)
  if (addOns.length === 0) {
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

  return (
    <div className="min-h-screen bg-[var(--dashboard-bg)]">
      <div className="sticky top-0 z-10 bg-[var(--dashboard-bg)]/95 backdrop-blur-sm border-b border-white/10">
        <div className="max-w-2xl mx-auto px-4 sm:px-6 py-4">
          <Link
            href={
              isOwnerManualBooking
                ? getBusinessBookPath(slug, { forOwner: true })
                : `/${slug}`
            }
            className="inline-flex items-center gap-2 text-gray-400 hover:text-white transition-colors"
          >
            <ArrowLeftIcon className="h-5 w-5" />
            <span className="text-sm font-medium">
              {isOwnerManualBooking ? 'Back to services' : 'Back to profile'}
            </span>
          </Link>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 sm:px-6 pt-6 pb-16 sm:pb-24">
        <ServiceDetailsScreen
          businessSlug={slug}
          serviceId={serviceId.trim()}
          service={service}
          addOns={addOns}
          initialAddOnIds={initialAddOnIds}
          isOwnerManualBooking={isOwnerManualBooking}
        />
      </div>
    </div>
  );
}
