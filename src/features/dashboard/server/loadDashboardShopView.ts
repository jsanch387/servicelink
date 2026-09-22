import { shopAddressNeedsUpdate } from '@/features/business-profile/utils/location';
import { isProAccess } from '@/features/pricing';
import type { Database } from '@/libs/supabase/client';
import type { SupabaseClient } from '@supabase/supabase-js';

type DashboardProfileRow = {
  id: string;
  business_name: string;
  business_type: string | null;
  service_area: string | null;
  business_zip: string | null;
  bio: string | null;
  created_at: string;
  updated_at: string;
  business_slug: string | null;
  business_link: string | null;
  legacy_request_booking_enabled: boolean | null;
  free_bookings_count: number | null;
  service_location_mode: string | null;
  shop_street_address: string | null;
  shop_city: string | null;
  shop_state: string | null;
  services: { count: number }[] | null;
  images: { count: number }[] | null;
};

type BusinessAvailabilityRow = {
  accept_bookings: boolean | null;
};

export type DashboardShopViewData = {
  businessProfile: {
    id: string;
    business_name: string;
    business_type: string | null;
    service_area: string | null;
    business_zip: string | null;
    bio: string | null;
    created_at: string;
    updated_at: string;
  };
  hasConfirmedServiceArea: boolean;
  needsShopAddressUpdate: boolean;
  slugData:
    | {
        hasSlug: true;
        slug?: string;
        fullLink?: string;
        createdAt: string;
      }
    | { hasSlug: false };
  analytics: {
    servicesCount: number;
    imagesCount: number;
    profileCompleteness: number;
  };
  nextSteps: {
    needsSlug: boolean;
    needsServices: boolean;
    needsImages: boolean;
    needsBio: boolean;
    readyToShare: boolean;
  };
  pendingRequestsCount: number;
  legacyRequestBookingEnabled: boolean;
  useAvailabilityBooking: boolean;
  upcomingBookingsCount: number;
  freeBookingsUsed: number;
  isFreeTier: boolean;
};

export async function loadDashboardShopView(
  supabase: SupabaseClient<Database>,
  businessId: string,
  options: { isFreeTier: boolean }
): Promise<DashboardShopViewData | null> {
  const { data: profileData, error: profileError } = await supabase
    .from('business_profiles')
    .select(
      `
          id, business_name, business_type, service_area, business_zip, bio, created_at, updated_at,
          business_slug, business_link, legacy_request_booking_enabled,
          free_bookings_count,
          service_location_mode, shop_street_address, shop_city, shop_state,
          services:business_services(count),
          images:business_images(count)
        `
    )
    .eq('id', businessId)
    .single();

  const profile = profileData as DashboardProfileRow | null;

  if (profileError || !profile) {
    return null;
  }

  const servicesCount =
    (profile.services as { count: number }[])?.[0]?.count || 0;
  const imagesCount = (profile.images as { count: number }[])?.[0]?.count || 0;
  const hasSlug = !!(profile.business_slug && profile.business_link);

  const checks = [
    profile.business_name,
    profile.business_type,
    profile.service_area,
    profile.bio && profile.bio.trim().length >= 50,
    hasSlug,
    servicesCount > 0,
    imagesCount > 0,
  ];
  const profileCompleteness = Math.round(
    (checks.filter(Boolean).length / checks.length) * 100
  );

  const { count: pendingRequestsCount } = await supabase
    .from('booking_requests')
    .select('*', { count: 'exact', head: true })
    .eq('business_id', profile.id)
    .eq('status', 'pending');

  const { data: availabilityRow } = await supabase
    .from('business_availability')
    .select('accept_bookings')
    .eq('business_id', profile.id)
    .maybeSingle();
  const availability = availabilityRow as BusinessAvailabilityRow | null;
  const useAvailabilityBooking = availability?.accept_bookings === true;
  const today = new Date().toISOString().slice(0, 10);
  let upcomingBookingsCount = 0;
  if (useAvailabilityBooking) {
    const { count } = await supabase
      .from('bookings')
      .select('*', { count: 'exact', head: true })
      .eq('business_id', profile.id)
      .eq('status', 'confirmed')
      .gte('scheduled_date', today);
    upcomingBookingsCount = count ?? 0;
  }

  const legacyRequestBookingEnabled =
    profile.legacy_request_booking_enabled === true;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: primaryServiceArea } = await (supabase as any)
    .from('business_service_areas')
    .select('id')
    .eq('business_profile_id', profile.id)
    .eq('is_primary', true)
    .eq('is_active', true)
    .maybeSingle();
  const hasConfirmedServiceArea = Boolean(primaryServiceArea?.id);

  return {
    businessProfile: {
      id: profile.id,
      business_name: profile.business_name,
      business_type: profile.business_type,
      service_area: profile.service_area,
      business_zip: profile.business_zip,
      bio: profile.bio,
      created_at: profile.created_at,
      updated_at: profile.updated_at,
    },
    hasConfirmedServiceArea,
    needsShopAddressUpdate: shopAddressNeedsUpdate(profile),
    slugData: hasSlug
      ? {
          hasSlug: true,
          slug: profile.business_slug ?? undefined,
          fullLink: profile.business_link ?? undefined,
          createdAt: profile.updated_at,
        }
      : { hasSlug: false },
    analytics: {
      servicesCount,
      imagesCount,
      profileCompleteness,
    },
    nextSteps: {
      needsSlug: !hasSlug,
      needsServices: servicesCount === 0,
      needsImages: imagesCount === 0,
      needsBio: !profile.bio || profile.bio.trim().length < 50,
      readyToShare:
        !!hasSlug &&
        servicesCount > 0 &&
        imagesCount > 0 &&
        !!profile.bio &&
        profile.bio.trim().length >= 50,
    },
    pendingRequestsCount: pendingRequestsCount ?? 0,
    legacyRequestBookingEnabled,
    useAvailabilityBooking,
    upcomingBookingsCount,
    freeBookingsUsed: profile.free_bookings_count ?? 0,
    isFreeTier: options.isFreeTier,
  };
}

export function isFreeTierFromProfileRow(
  profileRow: {
    subscription_tier?: string | null;
    subscription_current_period_end?: string | null;
    subscription_status?: string | null;
    stripe_subscription_id?: string | null;
    stripe_customer_id?: string | null;
  } | null
): boolean {
  return !isProAccess(
    profileRow?.subscription_tier,
    profileRow?.subscription_current_period_end,
    profileRow?.subscription_status,
    profileRow?.stripe_subscription_id,
    profileRow?.stripe_customer_id
  );
}
