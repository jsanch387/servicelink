/**
 * Booking Request Page
 *
 * Handles URLs like: myservicelink.app/johns-plumbing/book
 * Displays the booking request form for a specific business
 */

import { ResponsiveBackNavIcon } from '@/components/shared';
import { isVehicleRelatedBusinessType } from '@/constants/businessTypes';
import {
  OWNER_MANUAL_BOOKING_FOR,
  ROUTES,
  getBusinessBookPath,
  getBusinessBookScheduleUrl,
  getPublicBusinessProfilePath,
  type BookDetailsStepQuery,
} from '@/constants/routes';
import {
  BookServicePicker,
  type BookServicePickerItem,
} from '@/features/availability/booking/components/BookServicePicker';
import type { PublicBookingPaymentSettings } from '@/features/availability/booking/types';
import { configureBackNavLabelFromBookUrl } from '@/features/availability/booking/utils/configureBackNavLabelFromBookUrl';
import {
  publicBookingCalendarExitNavWithoutConfigureFunnel,
  publicBookingServiceRequiresConfigureUi,
  publicBookingShouldRenderConfigureScheduleFunnel,
} from '@/features/availability/booking/utils/publicBookingBookPageDecisions';
import { getAvailabilityForBusiness } from '@/features/availability/services/availabilityService';
import { parseStoredTimeOffBlocks } from '@/features/availability/types/blockTime';
import { hasAvailabilityConfigured } from '@/features/availability/utils/hasAvailabilityConfigured';
import { enrichServicesWithPublicBookingLoadHints } from '@/features/business-profile/server/publicBookingServiceHints';
import { isPublicBusinessSlugVisible } from '@/features/business-profile/server/publicBusinessSlugVisibility';
import { checkoutModeFromDb } from '@/features/payments/utils/paymentSettingsMaps';
import { isProAccess } from '@/features/pricing';
import { getAddOnsByIdsForBooking } from '@/features/services/api/getAddOnsByIdsForBooking';
import { getServiceWithAddOnsForBooking } from '@/features/services/api/getServiceWithAddOnsForBooking';
import { resolvePublicBookingService } from '@/features/services/api/resolvePublicBookingService';
import {
  BOOKING_FLOW_LOCALE_COOKIE_NAME,
  normalizePublicBookingOfferedLocales,
  resolvePublicBookingFlowLocale,
} from '@/libs/bookingFlowLocale';
import { publicBookingUi } from '@/libs/i18n/publicBookingUi';
import { createSupabaseAdminClient } from '@/libs/supabase/admin';
import type { Metadata } from 'next';
import { cookies } from 'next/headers';
import Link from 'next/link';
import { notFound, redirect } from 'next/navigation';
import { BookFlowSwitch } from './BookFlowSwitch';
import { PublicBookingConfigureScheduleFunnel } from './PublicBookingConfigureScheduleFunnel';

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
    /** Matches last book/details sub-step before calendar (`price` | `addons`). */
    detailsStep?: string;
    skipDetails?: string;
    /** `owner` = business owner booking on a customer's behalf (from dashboard). */
    for?: string;
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
  free_bookings_month: string | null;
  free_bookings_count: number | null;
  public_booking_locales: string[];
  public_booking_default_locale: string;
  [key: string]: unknown;
};

type ServiceRowForPicker = {
  id: string;
  name: string;
  description: string | null;
  price_cents: number | null;
  price_options_enabled: boolean | null;
  hours_to_complete: number | null;
  duration_minutes: number | null;
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
  row: ServiceRowForPicker & {
    public_booking_load_hint?: 'configure' | 'calendar';
  },
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
    publicBookingLoadHint: row.public_booking_load_hint,
  };
}

async function fetchBusinessProfileBySlug(slug: string) {
  try {
    const supabase = createSupabaseAdminClient();

    const { data: profileData, error } = await supabase
      .from('business_profiles')
      .select(
        'id, business_name, business_slug, business_type, legacy_request_booking_enabled, profile_id, free_bookings_month, free_bookings_count, public_booking_locales, public_booking_default_locale'
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
    detailsStep: detailsStepRaw,
    skipDetails,
    for: bookingForParam,
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

  // Free-tier cap: if this owner is on the free tier and has already used
  // all 5 bookings for the current month, treat as not accepting bookings
  // so we don't show the calendar/form at all.
  let reachedFreeCap = false;
  let ownerHasPro = false;
  if (businessProfile.profile_id) {
    const { data: ownerProfileRaw } = await adminClient
      .from('profiles')
      .select(
        'subscription_tier, subscription_current_period_end, subscription_status, stripe_subscription_id, stripe_customer_id'
      )
      .eq('user_id', businessProfile.profile_id)
      .maybeSingle();

    const ownerProfile: {
      subscription_tier?: string | null;
      subscription_current_period_end?: string | null;
      subscription_status?: string | null;
      stripe_subscription_id?: string | null;
      stripe_customer_id?: string | null;
    } | null = ownerProfileRaw as {
      subscription_tier?: string | null;
      subscription_current_period_end?: string | null;
      subscription_status?: string | null;
      stripe_subscription_id?: string | null;
      stripe_customer_id?: string | null;
    } | null;

    const hasPro = isProAccess(
      ownerProfile?.subscription_tier,
      ownerProfile?.subscription_current_period_end,
      ownerProfile?.subscription_status,
      ownerProfile?.stripe_subscription_id,
      ownerProfile?.stripe_customer_id
    );
    ownerHasPro = hasPro;
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

  const showAvailabilityServicePicker =
    effectiveUseAvailabilityBooking &&
    !showNotAcceptingBookings &&
    !(serviceId && serviceId.trim());

  let availabilityPickerServices: BookServicePickerItem[] = [];
  if (showAvailabilityServicePicker) {
    const { data: serviceRows, error: pickerServicesError } = await adminClient
      .from('business_services')
      .select(
        'id, name, description, price_cents, price_options_enabled, hours_to_complete, duration_minutes'
      )
      .eq('business_id', businessProfile.id)
      .eq('is_active', true)
      .order('sort_order', { ascending: true, nullsFirst: false })
      .order('created_at', { ascending: true });

    if (pickerServicesError) {
      console.error(
        'Error fetching services for book picker:',
        pickerServicesError
      );
    }

    const pickerRows =
      (serviceRows as ServiceRowForPicker[] | null)?.filter(
        r => r.id && r.name
      ) ?? [];
    const enrichedPickerRows = await enrichServicesWithPublicBookingLoadHints(
      adminClient,
      businessProfile.id,
      pickerRows,
      ownerHasPro
    );
    availabilityPickerServices = enrichedPickerRows.map(row =>
      mapRowToPickerItem(row, ownerHasPro)
    );

    if (availabilityPickerServices.length === 1) {
      const only = availabilityPickerServices[0];
      redirect(
        getBusinessBookScheduleUrl(slugForRoutes, {
          serviceId: only.id,
          forOwner: isOwnerManualBooking,
          lang: bookingFlowLocale,
          bookLoad: only.publicBookingLoadHint,
        })
      );
    }
  }

  const trimmedServiceId = serviceId?.trim() ?? '';

  type ServiceConfigureBundle = NonNullable<
    Awaited<ReturnType<typeof getServiceWithAddOnsForBooking>>
  >;
  let configureBundle: ServiceConfigureBundle | null = null;
  let needsConfigureStep = false;
  const fetchConfigureBundle =
    Boolean(trimmedServiceId) &&
    effectiveUseAvailabilityBooking &&
    !skipDetailsFlag;

  if (fetchConfigureBundle) {
    const bundle = await getServiceWithAddOnsForBooking(
      businessProfile.id,
      trimmedServiceId
    );
    if (!bundle) {
      notFound();
    }
    configureBundle = bundle;
    needsConfigureStep = publicBookingServiceRequiresConfigureUi({
      priceOptionsEnabled: bundle.service.priceOptionsEnabled,
      priceOptionCount: bundle.priceOptions.length,
      addOnCount: bundle.addOns.length,
    });
  }

  const allowInlinePriceConfigure =
    needsConfigureStep && !skipDetailsFlag && effectiveUseAvailabilityBooking;

  let serviceName = '';
  let serviceDurationMinutes = 60;
  let servicePriceForBooking: number | undefined;
  let selectedPriceOptionLabel: string | undefined;
  let resolvedServiceOk = false;

  if (trimmedServiceId) {
    const resolved = await resolvePublicBookingService(
      adminClient,
      businessProfile.id,
      trimmedServiceId,
      priceOptionId
    );

    if (resolved.ok) {
      resolvedServiceOk = true;
      const d = resolved.data;
      serviceName = d.serviceName;
      serviceDurationMinutes = d.serviceDurationMinutes;
      servicePriceForBooking = d.servicePriceCents;
      selectedPriceOptionLabel = d.selectedPriceOption?.label;
    } else if (
      allowInlinePriceConfigure &&
      (resolved.reason === 'price_option_required' ||
        resolved.reason === 'invalid_price_option')
    ) {
      // Inline configure + calendar funnel — no redirect.
    } else if (
      resolved.reason === 'price_option_required' ||
      resolved.reason === 'invalid_price_option'
    ) {
      redirect(
        getBusinessBookScheduleUrl(slugForRoutes, {
          serviceId: trimmedServiceId,
          addOnIds: addOnIds?.trim(),
          priceOptionId:
            resolved.reason === 'invalid_price_option'
              ? undefined
              : priceOptionId?.trim(),
          detailsStep: effectiveDetailsStep,
          forOwner: isOwnerManualBooking,
          lang: bookingFlowLocale,
        })
      );
    } else {
      notFound();
    }
  }

  if (!resolvedServiceOk && configureBundle) {
    serviceName = configureBundle.service.name;
    serviceDurationMinutes = configureBundle.service.durationMinutes;
    servicePriceForBooking = configureBundle.service.priceCents;
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

  let bookPageBackHref: string;
  let bookPageBackLabel: string;
  const profilePath = getPublicBusinessProfilePath(slugForRoutes, {
    lang: bookingFlowLocale,
  });

  if (isOwnerManualBooking) {
    if (!serviceId?.trim()) {
      bookPageBackHref = ROUTES.DASHBOARD.BOOKINGS;
      bookPageBackLabel = ui.nav.backToBookings;
    } else if (skipDetailsFlag) {
      bookPageBackHref = getBusinessBookPath(slugForRoutes, {
        forOwner: true,
        lang: bookingFlowLocale,
      });
      bookPageBackLabel = ui.nav.backToServices;
    } else {
      bookPageBackHref = getBusinessBookScheduleUrl(slugForRoutes, {
        serviceId: serviceId.trim(),
        addOnIds: addOnIds?.trim(),
        priceOptionId: priceOptionId?.trim(),
        detailsStep: effectiveDetailsStep,
        forOwner: true,
        lang: bookingFlowLocale,
      });
      bookPageBackLabel = configureBackNavLabelFromBookUrl(
        bookPageBackHref,
        ui.nav
      );
    }
  } else if (serviceId?.trim() && !skipDetailsFlag) {
    bookPageBackHref = getBusinessBookScheduleUrl(slugForRoutes, {
      serviceId: serviceId.trim(),
      addOnIds: addOnIds?.trim(),
      priceOptionId: priceOptionId?.trim(),
      detailsStep: effectiveDetailsStep,
      lang: bookingFlowLocale,
    });
    bookPageBackLabel = configureBackNavLabelFromBookUrl(
      bookPageBackHref,
      ui.nav
    );
  } else {
    bookPageBackHref = profilePath;
    bookPageBackLabel = ui.nav.backToProfile;
  }

  /** V2 calendar + details + review render their own sticky back bar; avoid duplicate header. */
  const calendarFlowOwnsHeader =
    effectiveUseAvailabilityBooking &&
    Boolean(trimmedServiceId) &&
    !showAvailabilityServicePicker &&
    !showNotAcceptingBookings;

  const showConfigureScheduleFunnel =
    publicBookingShouldRenderConfigureScheduleFunnel({
      needsConfigureStep,
      skipDetailsFlag,
      useAvailabilityBooking: effectiveUseAvailabilityBooking,
      hasConfigureBundle: configureBundle != null,
      showAvailabilityServicePicker,
      showNotAcceptingBookings,
    });

  const passedServiceConfigureGate =
    skipDetailsFlag ||
    detailsStepForBack === 'price' ||
    detailsStepForBack === 'addons' ||
    addonIdList.length > 0;

  const funnelInitialPhase: 'configure' | 'schedule' =
    showConfigureScheduleFunnel && configureBundle
      ? passedServiceConfigureGate
        ? 'schedule'
        : 'configure'
      : 'schedule';

  const initialAddOnIdsForFunnel = addOnIds?.trim()
    ? addOnIds
        .split(',')
        .map(s => s.trim())
        .filter(Boolean)
    : undefined;

  const calendarExitWhenNoConfigureFunnel =
    publicBookingCalendarExitNavWithoutConfigureFunnel({
      isOwnerManualBooking,
      businessSlug: slugForRoutes,
      bookingFlowLocale,
      labels: {
        backToProfile: ui.nav.backToProfile,
        backToServices: ui.nav.backToServices,
      },
    });

  const configureExitHref =
    serviceId?.trim() && !skipDetailsFlag
      ? getBusinessBookScheduleUrl(slugForRoutes, {
          serviceId: serviceId.trim(),
          addOnIds: addOnIds?.trim(),
          priceOptionId: priceOptionId?.trim(),
          detailsStep: effectiveDetailsStep,
          forOwner: isOwnerManualBooking,
          lang: bookingFlowLocale,
        })
      : bookPageBackHref;

  const bookFlowCoreProps = {
    useAvailabilityBooking: effectiveUseAvailabilityBooking,
    showNotAcceptingBookings: showNotAcceptingBookings,
    businessName: businessProfile.business_name,
    businessId: businessProfile.id,
    businessSlug: slugForRoutes,
    showVehicleFields: showVehicleFields,
    serviceId: serviceId?.trim() ?? undefined,
    addOnIds: addOnIds?.trim() || undefined,
    selectedAddOns: selectedAddOns,
    serviceName,
    servicePrice: servicePriceForBooking,
    serviceDurationMinutes,
    selectedPriceOptionLabel,
    weeklySchedule,
    timeOffBlocks,
    paymentSettings,
    isOwnerManualBooking,
    stripeCheckoutSessionId,
    bookingFlowLocale,
  };

  return (
    <>
      {!calendarFlowOwnsHeader && (
        <div className="sticky top-0 z-10 bg-[var(--dashboard-bg)]/95 backdrop-blur-sm border-b border-white/10">
          <div className="max-w-2xl mx-auto px-4 sm:px-6 py-4">
            <Link
              href={bookPageBackHref}
              className="inline-flex items-center gap-2 text-gray-400 hover:text-white transition-colors"
            >
              <ResponsiveBackNavIcon />
              <span className="text-sm font-medium">{bookPageBackLabel}</span>
            </Link>
          </div>
        </div>
      )}

      {calendarFlowOwnsHeader ? (
        <div className="pb-16 sm:pb-24">
          {showConfigureScheduleFunnel && configureBundle ? (
            <PublicBookingConfigureScheduleFunnel
              businessSlug={slugForRoutes}
              serviceId={trimmedServiceId}
              service={configureBundle.service}
              addOns={configureBundle.addOns}
              priceOptions={configureBundle.priceOptions}
              initialAddOnIds={initialAddOnIdsForFunnel}
              initialPriceOptionId={priceOptionId?.trim()}
              initialDetailsStep={effectiveDetailsStep}
              isOwnerManualBooking={isOwnerManualBooking}
              bookingFlowLocale={bookingFlowLocale}
              initialPhase={funnelInitialPhase}
              exitScheduleToConfigureHref={configureExitHref}
              bookFlowProps={{
                ...bookFlowCoreProps,
                exitCalendarFlowHref: configureExitHref,
                exitCalendarFlowLabel: bookPageBackLabel,
              }}
            />
          ) : (
            <BookFlowSwitch
              {...bookFlowCoreProps}
              exitCalendarFlowHref={calendarExitWhenNoConfigureFunnel.href}
              exitCalendarFlowLabel={calendarExitWhenNoConfigureFunnel.label}
            />
          )}
        </div>
      ) : (
        <div className="max-w-2xl mx-auto px-4 sm:px-6 pb-16 sm:pb-24 pt-6 sm:pt-8">
          {showAvailabilityServicePicker ? (
            <BookServicePicker
              businessSlug={slugForRoutes}
              businessName={businessProfile.business_name}
              services={availabilityPickerServices}
              isOwnerManualBooking={isOwnerManualBooking}
              bookingFlowLocale={bookingFlowLocale}
            />
          ) : (
            <BookFlowSwitch
              {...bookFlowCoreProps}
              exitCalendarFlowHref={bookPageBackHref}
              exitCalendarFlowLabel={bookPageBackLabel}
            />
          )}
        </div>
      )}
    </>
  );
}
