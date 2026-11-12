/**
 * Booking v2 — confirmation. The current `/book` flow is unchanged.
 * Showing this screen does not create the appointment or charge the card.
 */

import { BookFlowClientRedirect } from '@/features/availability/booking/components/BookFlowClientRedirect';
import type { PublicBookingPaymentSettings } from '@/features/availability/booking/types';
import { resolvePublicBookingFreeTierGate } from '@/features/availability/booking/server/publicBookingFreeTierCap';
import { getAvailabilityForBusiness } from '@/features/availability/services/availabilityService';
import { hasAvailabilityConfigured } from '@/features/availability/utils/hasAvailabilityConfigured';
import { isPublicBusinessSlugVisible } from '@/features/business-profile/server/publicBusinessSlugVisibility';
import { buildPublicBookingServiceLocation } from '@/features/business-profile/utils/publicServiceLocation';
import { BookingBookedScreen } from '@/features/booking-v2/components/BookingBookedScreen';
import { loadPublicActiveSale } from '@/features/marketing/server/loadPublicActiveSale';
import { checkoutModeFromDb } from '@/features/payments/utils/paymentSettingsMaps';
import { ownerHasProAccessForBusiness } from '@/features/pricing/server/ownerHasProAccessForBusiness';
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

interface BookingV2BookedPageProps {
  params: Promise<{ 'business-slug': string }>;
  searchParams: Promise<{ lang?: string }>;
}

type PaymentSettingsRowForBooking = {
  payments_enabled: boolean;
  checkout_mode: string | null;
  deposits_enabled: boolean;
  deposit_type: string;
  deposit_value: number;
  currency: string;
  tax_enabled?: boolean | null;
  tax_rate_bps?: number | null;
};

export async function generateMetadata(): Promise<Metadata> {
  return {
    title: 'Book',
    robots: 'noindex, follow',
  };
}

export default async function BookingV2BookedPage({
  params,
  searchParams,
}: BookingV2BookedPageProps) {
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
      'id, business_name, phone_number_call, legacy_request_booking_enabled, public_booking_locales, public_booking_default_locale, profile_id, free_bookings_count, service_location_mode, service_area, business_zip, shop_street_address, shop_unit, shop_city, shop_state, shop_zip'
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

  const location = buildPublicBookingServiceLocation(profileMeta);
  const ownerHasPro = await ownerHasProAccessForBusiness(
    adminClient,
    businessId
  );
  const sale = await loadPublicActiveSale(adminClient, businessId, {
    ownerHasPro,
  });

  const { data: paymentSettingsRow, error: paymentSettingsError } =
    await adminClient
      .from('payment_settings')
      .select(
        'payments_enabled, checkout_mode, deposits_enabled, deposit_type, deposit_value, currency, tax_enabled, tax_rate_bps'
      )
      .eq('business_id', businessId)
      .maybeSingle();

  if (paymentSettingsError) {
    console.error(
      'Error fetching payment settings for booking v2 confirmation:',
      paymentSettingsError
    );
  }

  const paymentSettings = ownerHasPro
    ? mapPaymentSettingsForBooking(
        (paymentSettingsRow as PaymentSettingsRowForBooking | null) ?? null
      )
    : null;
  const profile = profileMeta as {
    business_name?: string | null;
    phone_number_call?: string | null;
  };

  return (
    <BookingBookedScreen
      businessSlug={slug}
      businessName={profile.business_name?.trim() || slug}
      bookingFlowLocale={bookingFlowLocale}
      sale={sale}
      paymentSettings={paymentSettings}
      shopAddress={shopAddressLines(location)}
      businessPhone={profile.phone_number_call?.trim() || null}
      approvalRequired={
        availabilityRow?.public_booking_approval_required === true
      }
    />
  );
}

function mapPaymentSettingsForBooking(
  row: PaymentSettingsRowForBooking | null
): PublicBookingPaymentSettings | null {
  if (!row) return null;
  const depositType =
    row.deposit_type === 'fixed' || row.deposit_type === 'percent'
      ? row.deposit_type
      : 'percent';
  return {
    paymentsEnabled: row.payments_enabled === true,
    checkoutMode: checkoutModeFromDb(row.checkout_mode),
    depositsEnabled: row.deposits_enabled === true,
    depositType,
    depositValue: Number.isFinite(row.deposit_value) ? row.deposit_value : 0,
    currency: row.currency?.trim() || 'usd',
    taxEnabled: row.tax_enabled === true,
    taxRateBps:
      typeof row.tax_rate_bps === 'number' && Number.isFinite(row.tax_rate_bps)
        ? row.tax_rate_bps
        : 0,
  };
}

function shopAddressLines(location: {
  shopStreet: string;
  shopUnit: string;
  shopCity: string;
  shopState: string;
  shopZip: string;
}): { line1: string; line2: string } | null {
  const line1 = [location.shopStreet, location.shopUnit]
    .map(part => part.trim())
    .filter(Boolean)
    .join(', ');
  const region = [location.shopState, location.shopZip]
    .map(part => part.trim())
    .filter(Boolean)
    .join(' ');
  const line2 = [location.shopCity.trim(), region].filter(Boolean).join(', ');
  if (!line1 && !line2) return null;
  return { line1: line1 || line2, line2: line1 ? line2 : '' };
}
