/**
 * Booking Request Page
 *
 * Handles URLs like: myservicelink.app/johns-plumbing/book
 * Displays the booking request form for a specific business
 */

import { isVehicleRelatedBusinessType } from '@/constants/businessTypes';
import {
  OWNER_MANUAL_BOOKING_FOR,
  ROUTES,
  getBusinessBookDetailsUrl,
  getBusinessBookPath,
  getPublicBusinessProfilePath,
  type BookDetailsStepQuery,
} from '@/constants/routes';
import {
  BookServicePicker,
  type BookServicePickerItem,
} from '@/features/availability/booking/components/BookServicePicker';
import { resolvePublicBookingFreeTierGate } from '@/features/availability/booking/server/publicBookingFreeTierCap';
import type { PublicBookingPaymentSettings } from '@/features/availability/booking/types';
import { getAvailabilityForBusiness } from '@/features/availability/services/availabilityService';
import { parseStoredTimeOffBlocks } from '@/features/availability/types/blockTime';
import { hasAvailabilityConfigured } from '@/features/availability/utils/hasAvailabilityConfigured';
import { isPublicBusinessSlugVisible } from '@/features/business-profile/server/publicBusinessSlugVisibility';
import { buildPublicBookingServiceLocation } from '@/features/business-profile/utils/publicServiceLocation';
import { loadPublicActiveSale } from '@/features/marketing/server/loadPublicActiveSale';
import { checkoutModeFromDb } from '@/features/payments/utils/paymentSettingsMaps';
import { getAddOnsByIdsForBooking } from '@/features/services/api/getAddOnsByIdsForBooking';
import { resolvePublicBookingService } from '@/features/services/api/resolvePublicBookingService';
import { sortServicesForDisplay } from '@/features/services/categories/utils/sortServicesForDisplay';
import type { ServiceCategoryRow } from '@/features/services/categories/types/serviceCategories';
import type { ServiceRow } from '@/features/services/types/services';
import {
  BOOKING_FLOW_LOCALE_COOKIE_NAME,
  normalizePublicBookingOfferedLocales,
  resolvePublicBookingFlowLocale,
} from '@/libs/bookingFlowLocale';
import { publicBookingUi } from '@/libs/i18n/publicBookingUi';
import { createSupabaseAdminClient } from '@/libs/supabase/admin';
import {
  PublicFlowBackNavLabel,
  PublicFlowStickyBackHeader,
  publicFlowBackNavClassName,
} from '@/components/shared';
import type { Metadata } from 'next';
import { cookies } from 'next/headers';
import Link from 'next/link';
import { notFound, redirect } from 'next/navigation';
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
    priceOptionId?: string;
    customJob?: string;
    customServiceName?: string;
    customServicePriceCents?: string;
    customServiceDurationMinutes?: string;
    customJobNotes?: string;
    /** Matches last book/details sub-step before calendar (`price` | `addons`). */
    detailsStep?: string;
    skipDetails?: string;
    /** `owner` = business owner booking on a customer's behalf (from dashboard). */
    for?: string;
    /** Owner-only: restore services list after returning from service details. */
    entry?: string;
    /** Stripe Checkout return markers (set on success/cancel URLs). */
    checkout?: string;
    session_id?: string;
    lang?: string;
  }>;
}

type PublicBusinessProfileForBooking = {
  id: string;
  business_name: string;
  business_slug: string | null;
  business_type: string | null;
  legacy_request_booking_enabled: boolean | null;
  profile_id: string | null;
  free_bookings_count: number | null;
  public_booking_locales: string[];
  public_booking_default_locale: string;
  service_location_mode: string | null;
  service_area: string | null;
  business_zip: string | null;
  shop_street_address: string | null;
  shop_unit: string | null;
};

type ServiceRowForPicker = {
  id: string;
  name: string;
  description: string | null;
  price_cents: number | null;
  price_options_enabled: boolean | null;
  hours_to_complete: number | null;
  duration_minutes: number | null;
  category_id?: string | null;
  sort_order?: number | null;
  created_at?: string;
};

type PaymentSettingsRowForBooking = {
  payments_enabled: boolean;
  checkout_mode: string | null;
  deposits_enabled: boolean;
  deposit_type: string;
  deposit_value: number;
  currency: string;
};

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
  };
}

function mapRowToPickerItem(
  row: ServiceRowForPicker,
  ownerPro: boolean
): BookServicePickerItem {
  return {
    id: row.id,
    name: row.name,
    description: row.description,
    priceCents: row.price_cents ?? 0,
    priceOptionsEnabled: row.price_options_enabled === true && ownerPro,
    hours_to_complete: row.hours_to_complete ?? null,
    duration_minutes: row.duration_minutes ?? null,
    category_id: row.category_id ?? null,
  };
}

async function fetchBusinessProfileBySlug(slug: string) {
  try {
    const supabase = createSupabaseAdminClient();

    const { data: profileData, error } = await supabase
      .from('business_profiles')
      .select(
        'id, business_name, business_slug, business_type, legacy_request_booking_enabled, profile_id, free_bookings_count, public_booking_locales, public_booking_default_locale, service_location_mode, service_area, business_zip, shop_street_address, shop_unit'
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
  const sp = await searchParams;
  const {
    serviceId,
    addOnIds,
    priceOptionId,
    customJob,
    customServiceName,
    customServicePriceCents,
    customServiceDurationMinutes,
    customJobNotes,
    detailsStep: detailsStepRaw,
    skipDetails,
    for: bookingForParam,
    entry: entryParam,
    checkout: checkoutParam,
    session_id: sessionIdParam,
    lang: langParam,
  } = sp;

  const langFromQuery =
    typeof langParam === 'string'
      ? langParam
      : Array.isArray(langParam)
        ? langParam[0]
        : undefined;
  const cookieStore = await cookies();

  const stripeCheckoutSessionId =
    checkoutParam === 'success' && sessionIdParam?.trim()
      ? sessionIdParam.trim()
      : null;

  const detailsStepForBack: BookDetailsStepQuery | undefined =
    detailsStepRaw === 'addons' || detailsStepRaw === 'price'
      ? detailsStepRaw
      : undefined;
  const addonIdList = addOnIds?.trim()
    ? addOnIds
        .split(',')
        .map(s => s.trim())
        .filter(Boolean)
    : [];
  /** Prefer explicit param; infer add-ons step from legacy URLs that only had addOnIds. */
  const effectiveDetailsStep: BookDetailsStepQuery | undefined =
    detailsStepForBack ?? (addonIdList.length > 0 ? 'addons' : undefined);
  const isOwnerManualBooking = bookingForParam === OWNER_MANUAL_BOOKING_FOR;
  const isCustomOwnerBooking =
    isOwnerManualBooking &&
    (customJob === '1' || customJob === 'true') &&
    Boolean(customServiceName?.trim());
  const ownerEntryMode =
    isOwnerManualBooking && entryParam === 'services' ? 'services' : undefined;
  const skipDetailsFlag = skipDetails === '1' || skipDetails === 'true';

  // Fetch the business profile by slug
  const businessProfile = await fetchBusinessProfileBySlug(slug);

  // If profile not found, show 404
  if (!businessProfile) {
    notFound();
  }

  const bookingFlowLocale = resolvePublicBookingFlowLocale({
    offeredLocales: normalizePublicBookingOfferedLocales(
      businessProfile.public_booking_locales
    ),
    businessDefaultLocale: businessProfile.public_booking_default_locale,
    searchParamsLang: langFromQuery,
    cookieValue: cookieStore.get(BOOKING_FLOW_LOCALE_COOKIE_NAME)?.value,
  });
  const ui = publicBookingUi(bookingFlowLocale);

  const adminClient = createSupabaseAdminClient();
  if (!(await isPublicBusinessSlugVisible(adminClient, slug))) {
    notFound();
  }

  const slugForRoutes = businessProfile.business_slug || slug;

  // Fetch availability with admin client so RLS doesn't block (public page needs to read accept_bookings)
  const availabilityRow = await getAvailabilityForBusiness(
    adminClient,
    businessProfile.id
  );
  const useAvailabilityBooking = availabilityRow?.accept_bookings === true;
  const weeklySchedule = availabilityRow?.weekly_schedule ?? null;
  const timeOffBlocks = parseStoredTimeOffBlocks(
    availabilityRow?.time_off_blocks
  );
  const legacyRequestBookingEnabled =
    businessProfile.legacy_request_booking_enabled === true;
  const availabilityConfigured = hasAvailabilityConfigured(availabilityRow);

  // Free-tier lifetime cap: at limit on Free, treat as not accepting (same as public gate helper).
  const { reachedFreeCap, ownerHasPro } =
    await resolvePublicBookingFreeTierGate(adminClient, {
      profileId: businessProfile.profile_id ?? null,
      freeBookingsCount: businessProfile.free_bookings_count ?? null,
    });

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

  const showAvailabilityServicePicker =
    effectiveUseAvailabilityBooking &&
    !showNotAcceptingBookings &&
    !isCustomOwnerBooking &&
    !(serviceId && serviceId.trim());

  let availabilityPickerServices: BookServicePickerItem[] = [];
  let availabilityPickerCategories: ServiceCategoryRow[] = [];
  if (showAvailabilityServicePicker) {
    const [servicesQuery, categoriesQuery] = await Promise.all([
      adminClient
        .from('business_services')
        .select(
          'id, name, description, price_cents, price_options_enabled, hours_to_complete, duration_minutes, category_id, sort_order, created_at'
        )
        .eq('business_id', businessProfile.id)
        .eq('is_active', true)
        .order('created_at', { ascending: true }),
      adminClient
        .from('service_categories')
        .select('*')
        .eq('business_id', businessProfile.id)
        .order('sort_order', { ascending: true })
        .order('created_at', { ascending: true }),
    ]);

    if (servicesQuery.error) {
      console.error(
        'Error fetching services for book picker:',
        servicesQuery.error
      );
    }

    const sortedPickerRows = sortServicesForDisplay(
      (servicesQuery.data ?? []) as ServiceRow[],
      (categoriesQuery.data ?? []) as ServiceCategoryRow[]
    );

    availabilityPickerCategories = (categoriesQuery.data ??
      []) as ServiceCategoryRow[];

    availabilityPickerServices = sortedPickerRows
      .map(row => mapRowToPickerItem(row, ownerHasPro))
      .filter(s => s.id && s.name);

    if (availabilityPickerServices.length === 1 && !isOwnerManualBooking) {
      redirect(
        getBusinessBookDetailsUrl(slugForRoutes, {
          serviceId: availabilityPickerServices[0].id,
          forOwner: isOwnerManualBooking,
          lang: bookingFlowLocale,
        })
      );
    }
  }

  const trimmedServiceId = serviceId?.trim() ?? '';

  let serviceName = '';
  let serviceDurationMinutes = 60;
  let servicePriceForBooking: number | undefined;
  let selectedPriceOptionLabel: string | undefined;

  if (isCustomOwnerBooking) {
    serviceName = customServiceName?.trim() ?? '';
    const parsedDuration = Number.parseInt(
      customServiceDurationMinutes?.trim() ?? '',
      10
    );
    serviceDurationMinutes =
      Number.isInteger(parsedDuration) && parsedDuration > 0
        ? parsedDuration
        : 60;
    const parsedPriceCents = Number.parseInt(
      customServicePriceCents?.trim() ?? '',
      10
    );
    servicePriceForBooking =
      Number.isInteger(parsedPriceCents) && parsedPriceCents >= 0
        ? parsedPriceCents
        : 0;
  } else if (trimmedServiceId) {
    const resolved = await resolvePublicBookingService(
      adminClient,
      businessProfile.id,
      trimmedServiceId,
      priceOptionId
    );

    if (!resolved.ok) {
      if (
        resolved.reason === 'price_option_required' ||
        resolved.reason === 'invalid_price_option'
      ) {
        redirect(
          getBusinessBookDetailsUrl(slugForRoutes, {
            serviceId: trimmedServiceId,
            addOnIds: addOnIds?.trim(),
            priceOptionId: priceOptionId?.trim(),
            detailsStep: effectiveDetailsStep,
            forOwner: isOwnerManualBooking,
            lang: bookingFlowLocale,
          })
        );
      }
      notFound();
    }

    const d = resolved.data;
    serviceName = d.serviceName;
    serviceDurationMinutes = d.serviceDurationMinutes;
    servicePriceForBooking = d.servicePriceCents;
    selectedPriceOptionLabel = d.selectedPriceOption?.label;
  }

  // Fetch add-ons when addOnIds present (resolves IDs to full objects for display)
  const selectedAddOns =
    addonIdList.length > 0
      ? await getAddOnsByIdsForBooking(businessProfile.id, addonIdList)
      : [];

  const showVehicleFields = isVehicleRelatedBusinessType(
    businessProfile.business_type
  );

  const { data: paymentSettingsRow, error: paymentSettingsError } =
    await adminClient
      .from('payment_settings')
      .select(
        'payments_enabled, checkout_mode, deposits_enabled, deposit_type, deposit_value, currency'
      )
      .eq('business_id', businessProfile.id)
      .maybeSingle();

  if (paymentSettingsError) {
    console.error(
      'Error fetching payment settings for public booking:',
      paymentSettingsError
    );
  }

  // Payment checkout is a Pro-only capability. Keep stored settings intact in DB,
  // but suppress public payment behavior while owner lacks effective Pro access.
  const paymentSettings = ownerHasPro
    ? mapPaymentSettingsForBooking(
        (paymentSettingsRow as PaymentSettingsRowForBooking | null) ?? null
      )
    : null;

  const serviceLocation = buildPublicBookingServiceLocation(businessProfile);

  const activeSale = await loadPublicActiveSale(
    adminClient,
    businessProfile.id,
    {
      ownerHasPro,
    }
  );

  let bookPageBackHref: string;
  let bookPageBackLabel: string;
  const profilePath = getPublicBusinessProfilePath(slugForRoutes, {
    lang: bookingFlowLocale,
  });

  if (isOwnerManualBooking) {
    if (!serviceId?.trim() && !isCustomOwnerBooking) {
      bookPageBackHref = ROUTES.DASHBOARD.BOOKINGS;
      bookPageBackLabel = ui.nav.backToBookings;
    } else if (isCustomOwnerBooking) {
      bookPageBackHref = getBusinessBookPath(slugForRoutes, {
        forOwner: true,
        lang: bookingFlowLocale,
      });
      bookPageBackLabel = ui.nav.backToAppointmentType;
    } else if (skipDetailsFlag) {
      bookPageBackHref = getBusinessBookPath(slugForRoutes, {
        forOwner: true,
        entry: 'services',
        lang: bookingFlowLocale,
      });
      bookPageBackLabel = ui.nav.backToServices;
    } else {
      bookPageBackHref = getBusinessBookDetailsUrl(slugForRoutes, {
        serviceId: trimmedServiceId,
        addOnIds: addOnIds?.trim(),
        priceOptionId: priceOptionId?.trim(),
        detailsStep: effectiveDetailsStep,
        forOwner: true,
        lang: bookingFlowLocale,
      });
      bookPageBackLabel =
        effectiveDetailsStep === 'addons'
          ? ui.nav.backToAddOns
          : effectiveDetailsStep === 'price' && priceOptionId?.trim()
            ? ui.nav.backToOptions
            : ui.nav.backToService;
    }
  } else if (serviceId?.trim() && !skipDetailsFlag) {
    bookPageBackHref = getBusinessBookDetailsUrl(slugForRoutes, {
      serviceId: serviceId.trim(),
      addOnIds: addOnIds?.trim(),
      priceOptionId: priceOptionId?.trim(),
      detailsStep: effectiveDetailsStep,
      lang: bookingFlowLocale,
    });
    bookPageBackLabel =
      effectiveDetailsStep === 'addons'
        ? ui.nav.backToAddOns
        : effectiveDetailsStep === 'price' && priceOptionId?.trim()
          ? ui.nav.backToOptions
          : ui.nav.backToService;
  } else {
    bookPageBackHref = profilePath;
    bookPageBackLabel = ui.nav.backToProfile;
  }

  /** V2 calendar + details + review render their own sticky back bar; avoid duplicate header. */
  const calendarFlowOwnsHeader =
    effectiveUseAvailabilityBooking &&
    (Boolean(trimmedServiceId) || isCustomOwnerBooking) &&
    !showAvailabilityServicePicker &&
    !showNotAcceptingBookings;

  return (
    <>
      {!calendarFlowOwnsHeader && (
        <PublicFlowStickyBackHeader>
          <Link href={bookPageBackHref} className={publicFlowBackNavClassName}>
            <PublicFlowBackNavLabel label={bookPageBackLabel} />
          </Link>
        </PublicFlowStickyBackHeader>
      )}

      {calendarFlowOwnsHeader ? (
        <div className="pb-16 sm:pb-24">
          <BookFlowSwitch
            useAvailabilityBooking={effectiveUseAvailabilityBooking}
            showNotAcceptingBookings={showNotAcceptingBookings}
            reachedFreeCap={reachedFreeCap}
            businessName={businessProfile.business_name}
            businessId={businessProfile.id}
            businessSlug={slugForRoutes}
            showVehicleFields={showVehicleFields}
            serviceId={
              isCustomOwnerBooking ? undefined : serviceId?.trim() || undefined
            }
            addOnIds={addOnIds?.trim() || undefined}
            selectedAddOns={selectedAddOns}
            serviceName={serviceName}
            servicePrice={servicePriceForBooking}
            serviceDurationMinutes={serviceDurationMinutes}
            initialCustomerNotes={
              isCustomOwnerBooking ? customJobNotes?.trim() : undefined
            }
            selectedPriceOptionLabel={selectedPriceOptionLabel}
            weeklySchedule={weeklySchedule}
            timeOffBlocks={timeOffBlocks}
            paymentSettings={paymentSettings}
            isOwnerManualBooking={isOwnerManualBooking}
            exitCalendarFlowHref={bookPageBackHref}
            exitCalendarFlowLabel={bookPageBackLabel}
            stripeCheckoutSessionId={stripeCheckoutSessionId}
            bookingFlowLocale={bookingFlowLocale}
            serviceLocation={serviceLocation}
            activeSale={activeSale}
          />
        </div>
      ) : showAvailabilityServicePicker ? (
        <BookServicePicker
          businessSlug={slugForRoutes}
          businessName={businessProfile.business_name}
          services={availabilityPickerServices}
          serviceCategories={availabilityPickerCategories}
          isOwnerManualBooking={isOwnerManualBooking}
          initialEntryMode={ownerEntryMode}
          bookingFlowLocale={bookingFlowLocale}
        />
      ) : (
        <div className="max-w-2xl mx-auto px-4 sm:px-6 pb-16 sm:pb-24 pt-6 sm:pt-8">
          <BookFlowSwitch
            useAvailabilityBooking={effectiveUseAvailabilityBooking}
            showNotAcceptingBookings={showNotAcceptingBookings}
            reachedFreeCap={reachedFreeCap}
            businessName={businessProfile.business_name}
            businessId={businessProfile.id}
            businessSlug={slugForRoutes}
            showVehicleFields={showVehicleFields}
            serviceId={
              isCustomOwnerBooking ? undefined : serviceId?.trim() || undefined
            }
            addOnIds={addOnIds?.trim() || undefined}
            selectedAddOns={selectedAddOns}
            serviceName={serviceName}
            servicePrice={servicePriceForBooking}
            serviceDurationMinutes={serviceDurationMinutes}
            initialCustomerNotes={
              isCustomOwnerBooking ? customJobNotes?.trim() : undefined
            }
            selectedPriceOptionLabel={selectedPriceOptionLabel}
            weeklySchedule={weeklySchedule}
            timeOffBlocks={timeOffBlocks}
            paymentSettings={paymentSettings}
            isOwnerManualBooking={isOwnerManualBooking}
            exitCalendarFlowHref={bookPageBackHref}
            exitCalendarFlowLabel={bookPageBackLabel}
            stripeCheckoutSessionId={stripeCheckoutSessionId}
            bookingFlowLocale={bookingFlowLocale}
            serviceLocation={serviceLocation}
            activeSale={activeSale}
          />
        </div>
      )}
    </>
  );
}
