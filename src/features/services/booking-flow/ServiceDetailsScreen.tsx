'use client';

import {
  BookingFlowProgressBar,
  Button,
  ResponsiveBackNavIcon,
} from '@/components/shared';
import type { PublicBookingFlowLocale } from '@/constants/routes';
import {
  getBusinessBookPath,
  getBusinessBookScheduleUrl,
  getPublicBusinessProfilePath,
  type BookDetailsStepQuery,
} from '@/constants/routes';
import { formatDurationMinutes } from '@/features/availability/booking/utils/formatDuration';
import {
  configureBookingFlowProgressValue,
  getConfigurePhaseCount,
  getPostScheduleStepCount,
} from '@/features/availability/booking/utils/publicBookingFlowProgress';
import type {
  AddOnForBooking,
  PriceOptionForBooking,
  ServiceForBooking,
} from '@/features/services/api/getServiceWithAddOnsForBooking';
import {
  bcp47ForBookingLocale,
  publicBookingUi,
} from '@/libs/i18n/publicBookingUi';
import { ChevronRightIcon } from '@heroicons/react/24/outline';
import Link from 'next/link';
import { useCallback, useMemo, useState } from 'react';
import { AddOnSelector } from './AddOnSelector';
import { PriceOptionSelector } from './PriceOptionSelector';
import { ServiceDetailsBookingSummary } from './ServiceDetailsBookingSummary';
import type { ServiceAddOn } from './types';

interface ServiceDetailsScreenProps {
  businessSlug: string;
  serviceId: string;
  /** Service details from DB (passed by parent page). */
  service: ServiceForBooking;
  /** Add-ons assigned to this service from DB (passed by parent page). */
  addOns: AddOnForBooking[];
  /** Active price options when multi-price is on (may be empty). */
  priceOptions: PriceOptionForBooking[];
  /** Restore add-on selections when returning from calendar (from URL). */
  initialAddOnIds?: string[];
  /** Restore selected price option when returning from calendar / deep link. */
  initialPriceOptionId?: string;
  /** Restore price vs add-ons sub-step when returning from calendar (`?detailsStep=`). */
  initialDetailsStep?: BookDetailsStepQuery;
  /** Preserves `for=owner` on the continue-to-calendar URL (dashboard manual booking). */
  isOwnerManualBooking?: boolean;
  /** Funnel locale from server (`?lang=` + cookie). */
  bookingFlowLocale?: PublicBookingFlowLocale;
  /**
   * When set, "Date & time" uses client navigation (no full route load).
   * Caller should sync the URL (e.g. `history.replaceState`) if needed.
   */
  onScheduleContinue?: (scheduleUrl: string) => void;
  /**
   * With `bookingFlowPostScheduleStepCount`, drives one continuous progress bar
   * into the calendar step. Funnel should pass both; defaults keep tests simple.
   */
  bookingFlowConfigurePhaseCount?: number;
  bookingFlowPostScheduleStepCount?: number;
}

function formatPrice(cents: number, locale: PublicBookingFlowLocale): string {
  return new Intl.NumberFormat(bcp47ForBookingLocale(locale), {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0,
  }).format(cents / 100);
}

export function ServiceDetailsScreen({
  businessSlug,
  serviceId,
  service,
  addOns,
  priceOptions,
  initialAddOnIds,
  initialPriceOptionId,
  initialDetailsStep,
  isOwnerManualBooking = false,
  bookingFlowLocale = 'en',
  onScheduleContinue,
  bookingFlowConfigurePhaseCount: bookingFlowConfigurePhaseCountProp,
  bookingFlowPostScheduleStepCount: bookingFlowPostScheduleStepCountProp,
}: ServiceDetailsScreenProps) {
  const ui = useMemo(
    () => publicBookingUi(bookingFlowLocale),
    [bookingFlowLocale]
  );
  const needsPriceStep = service.priceOptionsEnabled && priceOptions.length > 0;

  const validInitialOptionId =
    initialPriceOptionId &&
    priceOptions.some(o => o.id === initialPriceOptionId)
      ? initialPriceOptionId
      : null;

  const [phase, setPhase] = useState<'price' | 'addons'>(() => {
    if (
      initialDetailsStep === 'addons' &&
      addOns.length > 0 &&
      (!needsPriceStep || Boolean(validInitialOptionId))
    ) {
      return 'addons';
    }
    return needsPriceStep ? 'price' : 'addons';
  });

  const [selectedPriceOptionId, setSelectedPriceOptionId] = useState<
    string | null
  >(() => (needsPriceStep ? validInitialOptionId : null));

  const [selectedAddOnIds, setSelectedAddOnIds] = useState<Set<string>>(
    () => new Set(initialAddOnIds ?? [])
  );

  const selectedPriceOption = useMemo(
    () =>
      selectedPriceOptionId
        ? (priceOptions.find(o => o.id === selectedPriceOptionId) ?? null)
        : null,
    [priceOptions, selectedPriceOptionId]
  );

  const basePriceCents = selectedPriceOption?.priceCents ?? service.priceCents;
  const baseDurationMinutes =
    selectedPriceOption?.durationMinutes ?? service.durationMinutes;

  const selectedAddOns: ServiceAddOn[] = useMemo(
    () => addOns.filter(a => selectedAddOnIds.has(a.id)),
    [addOns, selectedAddOnIds]
  );

  const totalCents = useMemo(
    () =>
      basePriceCents + selectedAddOns.reduce((sum, a) => sum + a.priceCents, 0),
    [basePriceCents, selectedAddOns]
  );

  const handleToggleAddOn = (id: string) => {
    setSelectedAddOnIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const buildCalendarUrl = useCallback(() => {
    return getBusinessBookScheduleUrl(businessSlug, {
      serviceId,
      priceOptionId:
        needsPriceStep && selectedPriceOptionId
          ? selectedPriceOptionId
          : undefined,
      addOnIds:
        selectedAddOnIds.size > 0
          ? Array.from(selectedAddOnIds).join(',')
          : undefined,
      detailsStep: phase === 'addons' ? 'addons' : 'price',
      forOwner: isOwnerManualBooking,
      lang: bookingFlowLocale,
    });
  }, [
    businessSlug,
    serviceId,
    needsPriceStep,
    selectedPriceOptionId,
    selectedAddOnIds,
    isOwnerManualBooking,
    phase,
    bookingFlowLocale,
  ]);

  const calendarUrl = buildCalendarUrl();

  const handleScheduleContinue = () => {
    if (onScheduleContinue) onScheduleContinue(calendarUrl);
  };

  const canContinueFromPrice = Boolean(selectedPriceOptionId);
  const showAddOnSection = addOns.length > 0;

  const configureHeaderProgress = useMemo(() => {
    const configureCount =
      bookingFlowConfigurePhaseCountProp ??
      getConfigurePhaseCount(needsPriceStep, showAddOnSection);
    const postCount =
      bookingFlowPostScheduleStepCountProp ??
      getPostScheduleStepCount(null, isOwnerManualBooking);
    return configureBookingFlowProgressValue({
      configurePhaseCount: configureCount,
      postScheduleStepCount: postCount,
      needsPriceStep,
      showAddOnSection,
      phase,
    });
  }, [
    bookingFlowConfigurePhaseCountProp,
    bookingFlowPostScheduleStepCountProp,
    needsPriceStep,
    showAddOnSection,
    phase,
    isOwnerManualBooking,
  ]);

  const handlePriceStepContinue = () => {
    if (!canContinueFromPrice) return;
    if (showAddOnSection) setPhase('addons');
  };

  const primaryButtonHref =
    phase === 'price' && !showAddOnSection ? calendarUrl : undefined;

  const showPrimaryAsLink =
    phase === 'price' && !showAddOnSection && canContinueFromPrice;

  const showStartingAtOnly =
    phase === 'price' && needsPriceStep && !selectedPriceOption;

  const durationForHeader = showStartingAtOnly
    ? service.durationMinutes
    : baseDurationMinutes;

  const exitDetailsHref = isOwnerManualBooking
    ? getBusinessBookPath(businessSlug, {
        forOwner: true,
        lang: bookingFlowLocale,
      })
    : getPublicBusinessProfilePath(businessSlug, {
        lang: bookingFlowLocale,
      });
  const exitDetailsLabel = isOwnerManualBooking
    ? ui.nav.backToServices
    : ui.serviceDetails.backToProfile;

  return (
    <>
      <div className="sticky top-0 z-10 bg-[var(--dashboard-bg)]/95 backdrop-blur-sm border-b border-white/10">
        <div className="max-w-2xl mx-auto px-4 sm:px-6 py-4">
          {phase === 'addons' && needsPriceStep ? (
            <button
              type="button"
              onClick={() => setPhase('price')}
              className="inline-flex items-center gap-2 text-gray-400 hover:text-white transition-colors"
            >
              <ResponsiveBackNavIcon />
              <span className="text-sm font-medium">
                {ui.serviceDetails.backToOptions}
              </span>
            </button>
          ) : (
            <Link
              href={exitDetailsHref}
              className="inline-flex items-center gap-2 text-gray-400 hover:text-white transition-colors"
            >
              <ResponsiveBackNavIcon />
              <span className="text-sm font-medium">{exitDetailsLabel}</span>
            </Link>
          )}
        </div>
        <BookingFlowProgressBar value={configureHeaderProgress} />
      </div>

      <div className="flex flex-col min-h-[60vh] max-w-2xl mx-auto px-4 sm:px-6 pt-6 pb-16 sm:pb-24 w-full">
        <div className="flex-1 pb-28">
          <section className="mb-6">
            {/* Match calendar step: title + duration (left), price (right, same row as title) */}
            <div className="flex justify-between gap-4 items-start mb-2">
              <div className="min-w-0 flex-1">
                <h1 className="text-lg font-semibold text-white leading-snug tracking-tight">
                  {service.name}
                </h1>
                <div className="mt-0.5 flex items-center gap-1 text-sm tabular-nums italic">
                  <p className="text-zinc-400">
                    {formatDurationMinutes(
                      durationForHeader,
                      bookingFlowLocale
                    )}
                  </p>
                  {selectedPriceOption &&
                  (phase === 'price' || phase === 'addons') ? (
                    <>
                      <span
                        aria-hidden="true"
                        className="text-zinc-500 not-italic leading-none"
                      >
                        &bull;
                      </span>
                      <p className="text-zinc-500 not-italic">
                        {selectedPriceOption.label}
                      </p>
                    </>
                  ) : null}
                </div>
              </div>
              <div className="shrink-0 text-right pt-0.5 min-w-[4.5rem]">
                {showStartingAtOnly ? (
                  <span className="text-sm text-zinc-400 tabular-nums leading-snug">
                    {ui.serviceDetails.startingAt}{' '}
                    {formatPrice(service.priceCents, bookingFlowLocale)}
                  </span>
                ) : (
                  <span className="text-sm text-zinc-300 tabular-nums">
                    {formatPrice(basePriceCents, bookingFlowLocale)}
                  </span>
                )}
              </div>
            </div>
            <p className="text-sm text-zinc-500 leading-relaxed whitespace-pre-line break-words">
              {service.description}
            </p>
          </section>

          {phase === 'price' && needsPriceStep && (
            <section className="mb-6">
              <h2 className="text-base font-semibold text-white mb-3">
                {ui.serviceDetails.chooseOption}
              </h2>
              <PriceOptionSelector
                options={priceOptions}
                selectedId={selectedPriceOptionId}
                onSelect={setSelectedPriceOptionId}
              />
            </section>
          )}

          {phase === 'addons' && showAddOnSection && (
            <section className="mb-6">
              <h2 className="text-base font-semibold text-white mb-3">
                {ui.serviceDetails.optionalAddOns}
              </h2>
              <AddOnSelector
                addOns={addOns as ServiceAddOn[]}
                selectedIds={selectedAddOnIds}
                onToggle={handleToggleAddOn}
              />
            </section>
          )}

          <section className="mb-8">
            <ServiceDetailsBookingSummary
              serviceName={service.name}
              servicePriceCents={basePriceCents}
              selectedVariantLabel={selectedPriceOption?.label}
              selectedAddOns={selectedAddOns}
              totalCents={totalCents}
              serviceLabel={ui.common.service}
              addOnsLabel={ui.common.addOns}
              totalLabel={ui.common.total}
              bookingFlowLocale={bookingFlowLocale}
            />
          </section>
        </div>

        <div
          className="fixed bottom-0 left-0 right-0 z-20 border-t border-white/10 bg-[var(--dashboard-bg)]/95 backdrop-blur-sm p-4 safe-area-pb"
          style={{ paddingBottom: 'max(1rem, env(safe-area-inset-bottom))' }}
        >
          <div className="max-w-2xl mx-auto">
            {phase === 'price' && showAddOnSection && (
              <Button
                type="button"
                variant="inverse"
                fullWidth
                className="font-semibold"
                disabled={!canContinueFromPrice}
                onClick={handlePriceStepContinue}
                icon={<ChevronRightIcon className="h-5 w-5" />}
                iconPosition="right"
              >
                {ui.serviceDetails.continue}
              </Button>
            )}

            {phase === 'price' && !showAddOnSection && (
              <>
                {showPrimaryAsLink ? (
                  <Button
                    {...(onScheduleContinue
                      ? {
                          type: 'button' as const,
                          onClick: handleScheduleContinue,
                        }
                      : { href: primaryButtonHref })}
                    variant="inverse"
                    fullWidth
                    className="font-semibold"
                    icon={<ChevronRightIcon className="h-5 w-5" />}
                    iconPosition="right"
                  >
                    {ui.serviceDetails.dateAndTime}
                  </Button>
                ) : (
                  <Button
                    type="button"
                    variant="inverse"
                    fullWidth
                    className="font-semibold"
                    disabled
                    icon={<ChevronRightIcon className="h-5 w-5" />}
                    iconPosition="right"
                  >
                    {ui.serviceDetails.dateAndTime}
                  </Button>
                )}
              </>
            )}

            {phase === 'addons' && (
              <Button
                {...(onScheduleContinue
                  ? {
                      type: 'button' as const,
                      onClick: handleScheduleContinue,
                    }
                  : { href: calendarUrl })}
                variant="inverse"
                fullWidth
                className="font-semibold"
                icon={<ChevronRightIcon className="h-5 w-5" />}
                iconPosition="right"
              >
                {ui.serviceDetails.dateAndTime}
              </Button>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
