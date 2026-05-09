'use client';

import type {
  BookDetailsStepQuery,
  PublicBookingFlowLocale,
} from '@/constants/routes';
import type { AddOnDisplay } from '@/features/availability/booking/types';
import { configureBackNavLabelFromBookUrl } from '@/features/availability/booking/utils/configureBackNavLabelFromBookUrl';
import {
  getConfigurePhaseCount,
  getPostScheduleStepCount,
} from '@/features/availability/booking/utils/publicBookingFlowProgress';
import type {
  AddOnForBooking,
  PriceOptionForBooking,
  ServiceForBooking,
} from '@/features/services/api/getServiceWithAddOnsForBooking';
import { ServiceDetailsScreen } from '@/features/services/booking-flow';
import { publicBookingUi } from '@/libs/i18n/publicBookingUi';
import type { ComponentProps } from 'react';
import { useCallback, useMemo, useState } from 'react';
import { BookFlowSwitch } from './BookFlowSwitch';

export type ConfigureSchedulePhase = 'configure' | 'schedule';

type BookFlowSwitchProps = ComponentProps<typeof BookFlowSwitch>;

function parseBookUrlSearch(href: string): {
  detailsStep?: BookDetailsStepQuery;
  priceOptionId?: string;
  addOnIds?: string[];
} {
  const u = href.startsWith('http')
    ? new URL(href)
    : new URL(href, 'https://book.local');
  const rawStep = u.searchParams.get('detailsStep')?.trim();
  const detailsStep: BookDetailsStepQuery | undefined =
    rawStep === 'addons' || rawStep === 'price' ? rawStep : undefined;
  const csv = u.searchParams.get('addOnIds')?.trim();
  const addOnIds = csv
    ? csv
        .split(',')
        .map(s => s.trim())
        .filter(Boolean)
    : undefined;
  return {
    detailsStep,
    priceOptionId: u.searchParams.get('priceOptionId')?.trim() || undefined,
    addOnIds,
  };
}

function deriveScheduleDisplayFromUrl(
  scheduleUrl: string,
  service: ServiceForBooking,
  priceOptions: PriceOptionForBooking[],
  addOns: AddOnForBooking[]
): {
  addOnIds: string | undefined;
  priceOptionId: string | undefined;
  selectedAddOns: AddOnDisplay[];
  serviceName: string;
  servicePriceCents: number;
  serviceDurationMinutes: number;
  selectedPriceOptionLabel: string | undefined;
} {
  const u = scheduleUrl.startsWith('http')
    ? new URL(scheduleUrl)
    : new URL(scheduleUrl, 'https://book.local');
  const priceOptionId =
    u.searchParams.get('priceOptionId')?.trim() || undefined;
  const addOnIdsRaw = u.searchParams.get('addOnIds')?.trim();
  const addonIdList = addOnIdsRaw
    ? addOnIdsRaw
        .split(',')
        .map(x => x.trim())
        .filter(Boolean)
    : [];
  const selectedAddOns: AddOnDisplay[] = addOns
    .filter(a => addonIdList.includes(a.id))
    .map(a => ({
      id: a.id,
      name: a.name,
      priceCents: a.priceCents,
      durationMinutes: a.durationMinutes ?? null,
    }));
  const needsPriceOption =
    service.priceOptionsEnabled && priceOptions.length > 0;
  const opt = priceOptionId
    ? priceOptions.find(o => o.id === priceOptionId)
    : null;
  const basePrice = needsPriceOption
    ? (opt?.priceCents ?? service.priceCents)
    : service.priceCents;
  let baseDuration = service.durationMinutes;
  if (opt?.durationMinutes != null && opt.durationMinutes > 0) {
    baseDuration = opt.durationMinutes;
  }
  return {
    addOnIds: addOnIdsRaw || undefined,
    priceOptionId,
    selectedAddOns,
    serviceName: service.name,
    servicePriceCents: basePrice,
    serviceDurationMinutes: Math.max(15, baseDuration),
    selectedPriceOptionLabel: opt?.label,
  };
}

export interface PublicBookingConfigureScheduleFunnelProps {
  businessSlug: string;
  serviceId: string;
  service: ServiceForBooking;
  addOns: AddOnForBooking[];
  priceOptions: PriceOptionForBooking[];
  initialAddOnIds?: string[];
  initialPriceOptionId?: string;
  initialDetailsStep?: BookDetailsStepQuery;
  isOwnerManualBooking: boolean;
  bookingFlowLocale: PublicBookingFlowLocale;
  initialPhase: ConfigureSchedulePhase;
  /** Fallback when opening the calendar first (deep link) — same shape as configure URLs. */
  exitScheduleToConfigureHref: string;
  bookFlowProps: BookFlowSwitchProps;
}

export function PublicBookingConfigureScheduleFunnel({
  businessSlug,
  serviceId,
  service,
  addOns,
  priceOptions,
  initialAddOnIds,
  initialPriceOptionId,
  initialDetailsStep,
  isOwnerManualBooking,
  bookingFlowLocale,
  initialPhase,
  exitScheduleToConfigureHref,
  bookFlowProps,
}: PublicBookingConfigureScheduleFunnelProps) {
  const [phase, setPhase] = useState<ConfigureSchedulePhase>(initialPhase);
  const [scheduleFromConfigure, setScheduleFromConfigure] = useState<ReturnType<
    typeof deriveScheduleDisplayFromUrl
  > | null>(null);
  const [configureRestoreUrl, setConfigureRestoreUrl] = useState<string | null>(
    null
  );
  /**
   * After calendar → configure, URL is updated via replaceState but RSC props stay stale.
   * Parsed query drives ServiceDetailsScreen remount so the correct sub-step (price vs add-ons) restores.
   */
  const [configureRestoredSearch, setConfigureRestoredSearch] =
    useState<ReturnType<typeof parseBookUrlSearch> | null>(null);
  const [configureRemountNonce, setConfigureRemountNonce] = useState(0);

  const bookingFlowConfigurePhaseCount = useMemo(
    () =>
      getConfigurePhaseCount(
        Boolean(service.priceOptionsEnabled && priceOptions.length > 0),
        addOns.length > 0
      ),
    [service.priceOptionsEnabled, priceOptions.length, addOns.length]
  );

  const bookingFlowPostScheduleStepCount = useMemo(
    () =>
      getPostScheduleStepCount(
        bookFlowProps.paymentSettings ?? null,
        bookFlowProps.isOwnerManualBooking ?? false
      ),
    [bookFlowProps.paymentSettings, bookFlowProps.isOwnerManualBooking]
  );

  /** URL after “continue to calendar” has the real `detailsStep`; server props still reflect first paint. */
  const exitCalendarFlowLabelResolved = useMemo(
    () =>
      configureBackNavLabelFromBookUrl(
        configureRestoreUrl ?? exitScheduleToConfigureHref,
        publicBookingUi(bookingFlowLocale).nav
      ),
    [configureRestoreUrl, exitScheduleToConfigureHref, bookingFlowLocale]
  );

  const syncUrl = useCallback((href: string) => {
    if (typeof window === 'undefined') return;
    const path = href.startsWith('http')
      ? new URL(href).pathname + new URL(href).search
      : href;
    window.history.replaceState(window.history.state, '', path);
  }, []);

  const handleScheduleContinue = useCallback(
    (scheduleUrl: string) => {
      const derived = deriveScheduleDisplayFromUrl(
        scheduleUrl,
        service,
        priceOptions,
        addOns
      );
      setConfigureRestoreUrl(scheduleUrl);
      setConfigureRestoredSearch(null);
      syncUrl(scheduleUrl);
      setScheduleFromConfigure(derived);
      setPhase('schedule');
    },
    [service, priceOptions, addOns, syncUrl]
  );

  const handleExitScheduleToConfigure = useCallback(() => {
    const href = configureRestoreUrl ?? exitScheduleToConfigureHref;
    syncUrl(href);
    setConfigureRestoredSearch(parseBookUrlSearch(href));
    setConfigureRemountNonce(n => n + 1);
    setScheduleFromConfigure(null);
    setPhase('configure');
  }, [configureRestoreUrl, exitScheduleToConfigureHref, syncUrl]);

  const mergedBookFlow = useMemo((): BookFlowSwitchProps => {
    const overlay = scheduleFromConfigure;
    return {
      ...bookFlowProps,
      serviceId: bookFlowProps.serviceId ?? serviceId,
      addOnIds: overlay?.addOnIds ?? bookFlowProps.addOnIds,
      selectedAddOns: overlay?.selectedAddOns ?? bookFlowProps.selectedAddOns,
      serviceName: overlay?.serviceName ?? bookFlowProps.serviceName,
      servicePrice: overlay?.servicePriceCents ?? bookFlowProps.servicePrice,
      serviceDurationMinutes:
        overlay?.serviceDurationMinutes ?? bookFlowProps.serviceDurationMinutes,
      selectedPriceOptionLabel:
        overlay?.selectedPriceOptionLabel ??
        bookFlowProps.selectedPriceOptionLabel,
      exitCalendarFlowHref: bookFlowProps.exitCalendarFlowHref,
      exitCalendarFlowLabel: exitCalendarFlowLabelResolved,
      onExitScheduleStep: handleExitScheduleToConfigure,
      bookingFlowConfigurePhaseCount,
    };
  }, [
    bookFlowProps,
    serviceId,
    scheduleFromConfigure,
    exitCalendarFlowLabelResolved,
    handleExitScheduleToConfigure,
    bookingFlowConfigurePhaseCount,
  ]);

  if (phase === 'configure') {
    const effDetailsStep =
      configureRestoredSearch?.detailsStep ?? initialDetailsStep;
    const effAddOnIds = configureRestoredSearch?.addOnIds ?? initialAddOnIds;
    const effPriceOptionId =
      configureRestoredSearch?.priceOptionId ??
      initialPriceOptionId ??
      undefined;

    return (
      <ServiceDetailsScreen
        key={`configure-${serviceId}-${configureRemountNonce}`}
        businessSlug={businessSlug}
        serviceId={serviceId}
        service={service}
        addOns={addOns}
        priceOptions={priceOptions}
        initialAddOnIds={effAddOnIds}
        initialPriceOptionId={effPriceOptionId}
        initialDetailsStep={effDetailsStep}
        isOwnerManualBooking={isOwnerManualBooking}
        bookingFlowLocale={bookingFlowLocale}
        onScheduleContinue={handleScheduleContinue}
        bookingFlowConfigurePhaseCount={bookingFlowConfigurePhaseCount}
        bookingFlowPostScheduleStepCount={bookingFlowPostScheduleStepCount}
      />
    );
  }

  return <BookFlowSwitch {...mergedBookFlow} />;
}
