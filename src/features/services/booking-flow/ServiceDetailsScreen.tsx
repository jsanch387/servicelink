'use client';

import { Button } from '@/components/shared';
import type { PublicBookingFlowLocale } from '@/constants/routes';
import {
  ROUTES,
  getBusinessBookPath,
  getBusinessBookScheduleUrl,
  getPublicBusinessProfilePath,
  type BookDetailsStepQuery,
  type BookServiceLocationTypeQuery,
} from '@/constants/routes';
import { BookingServiceLocationChoice } from '@/features/availability/booking/components/BookingServiceLocationSteps';
import {
  isCustomerServiceLocationChoiceValid,
  type CustomerServiceChoice,
} from '@/features/availability/booking/utils/bookingServiceLocationFlow';
import type { PublicBookingServiceLocation } from '@/features/business-profile/utils/publicServiceLocation';
import type {
  AddOnForBooking,
  PriceOptionForBooking,
  ServiceForBooking,
} from '@/features/services/api/getServiceWithAddOnsForBooking';
import { publicBookingUi } from '@/libs/i18n/publicBookingUi';
import {
  PublicFlowBackNavLabel,
  PublicFlowStickyBackHeader,
  publicFlowBackNavClassName,
} from '@/components/shared';
import { ChevronRightIcon } from '@heroicons/react/24/outline';
import Link from 'next/link';
import { useCallback, useMemo, useState } from 'react';
import { BookCalendarLoadingSkeleton } from '@/features/availability/booking/components/BookCalendarLoadingSkeleton';
import { AddOnSelector } from './AddOnSelector';
import { PriceOptionSelector } from './PriceOptionSelector';
import { ServiceDetailsBookingSummary } from './ServiceDetailsBookingSummary';
import type { ServiceAddOn } from './types';

type ServiceDetailsPhase = 'price' | 'addons' | 'location';

interface ServiceDetailsScreenProps {
  businessSlug: string;
  serviceId: string;
  /** Service details from DB (passed by parent page). */
  service: ServiceForBooking;
  /** Add-ons assigned to this service from DB (passed by parent page). */
  addOns: AddOnForBooking[];
  /** Active price options when multi-price is on (may be empty). */
  priceOptions: PriceOptionForBooking[];
  /** When mode is `both`, customer picks mobile vs shop before the calendar. */
  serviceLocation: PublicBookingServiceLocation;
  /** Restore add-on selections when returning from calendar (from URL). */
  initialAddOnIds?: string[];
  /** Restore selected price option when returning from calendar / deep link. */
  initialPriceOptionId?: string;
  /** Restore price / add-ons / location sub-step when returning from calendar. */
  initialDetailsStep?: BookDetailsStepQuery;
  /** Restore mobile vs shop when returning from calendar. */
  initialServiceLocationType?: BookServiceLocationTypeQuery;
  /** Preserves `for=owner` on the continue-to-calendar URL (dashboard manual booking). */
  isOwnerManualBooking?: boolean;
  /** Funnel locale from server (`?lang=` + cookie). */
  bookingFlowLocale?: PublicBookingFlowLocale;
}

function resolveInitialPhase(params: {
  needsPriceStep: boolean;
  showAddOnSection: boolean;
  needsLocationStep: boolean;
  initialDetailsStep?: BookDetailsStepQuery;
  hasValidPriceOption: boolean;
}): ServiceDetailsPhase {
  const {
    needsPriceStep,
    showAddOnSection,
    needsLocationStep,
    initialDetailsStep,
    hasValidPriceOption,
  } = params;

  if (
    initialDetailsStep === 'location' &&
    needsLocationStep &&
    (!needsPriceStep || hasValidPriceOption)
  ) {
    return 'location';
  }

  if (
    initialDetailsStep === 'addons' &&
    showAddOnSection &&
    (!needsPriceStep || hasValidPriceOption)
  ) {
    return 'addons';
  }

  if (needsPriceStep) return 'price';
  if (showAddOnSection) return 'addons';
  return 'location';
}

export function ServiceDetailsScreen({
  businessSlug,
  serviceId,
  service,
  addOns,
  priceOptions,
  serviceLocation,
  initialAddOnIds,
  initialPriceOptionId,
  initialDetailsStep,
  initialServiceLocationType,
  isOwnerManualBooking = false,
  bookingFlowLocale = 'en',
}: ServiceDetailsScreenProps) {
  const ui = useMemo(
    () => publicBookingUi(bookingFlowLocale),
    [bookingFlowLocale]
  );
  const needsPriceStep = service.priceOptionsEnabled && priceOptions.length > 0;
  const showAddOnSection = addOns.length > 0;
  const needsLocationStep = serviceLocation.mode === 'both';

  const validInitialOptionId =
    initialPriceOptionId &&
    priceOptions.some(o => o.id === initialPriceOptionId)
      ? initialPriceOptionId
      : null;

  const [phase, setPhase] = useState<ServiceDetailsPhase>(() =>
    resolveInitialPhase({
      needsPriceStep,
      showAddOnSection,
      needsLocationStep,
      initialDetailsStep,
      hasValidPriceOption: Boolean(validInitialOptionId),
    })
  );

  const [selectedPriceOptionId, setSelectedPriceOptionId] = useState<
    string | null
  >(() => (needsPriceStep ? validInitialOptionId : null));

  const [selectedAddOnIds, setSelectedAddOnIds] = useState<Set<string>>(
    () => new Set(initialAddOnIds ?? [])
  );
  const [customerServiceChoice, setCustomerServiceChoice] =
    useState<CustomerServiceChoice>(() =>
      needsLocationStep && initialServiceLocationType
        ? initialServiceLocationType
        : null
    );
  const [isNavigatingToCalendar, setIsNavigatingToCalendar] = useState(false);

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
    const detailsStepForBack: BookDetailsStepQuery = needsLocationStep
      ? 'location'
      : phase === 'addons'
        ? 'addons'
        : 'price';

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
      detailsStep: detailsStepForBack,
      serviceLocationType:
        needsLocationStep &&
        (customerServiceChoice === 'mobile' || customerServiceChoice === 'shop')
          ? customerServiceChoice
          : undefined,
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
    needsLocationStep,
    customerServiceChoice,
  ]);

  const calendarUrl = buildCalendarUrl();

  const canContinueFromPrice = Boolean(selectedPriceOptionId);
  const canContinueFromLocation = isCustomerServiceLocationChoiceValid(
    serviceLocation,
    customerServiceChoice
  );
  const showShopIncompleteError =
    needsLocationStep &&
    customerServiceChoice === 'shop' &&
    !serviceLocation.hasCompleteShopAddress;

  const advanceAfterPriceOrAddOns = () => {
    if (needsLocationStep) {
      setPhase('location');
      return;
    }
  };

  const handlePriceStepContinue = () => {
    if (!canContinueFromPrice) return;
    if (showAddOnSection) {
      setPhase('addons');
      return;
    }
    advanceAfterPriceOrAddOns();
  };

  const handleAddOnsContinue = () => {
    if (needsLocationStep) {
      setPhase('location');
    }
  };

  const goesStraightToCalendarFromPrice =
    phase === 'price' && !showAddOnSection && !needsLocationStep;
  const goesStraightToCalendarFromAddOns =
    phase === 'addons' && !needsLocationStep;
  const goesStraightToCalendarFromLocation = phase === 'location';

  const showPrimaryAsLink =
    (goesStraightToCalendarFromPrice && canContinueFromPrice) ||
    goesStraightToCalendarFromAddOns ||
    (goesStraightToCalendarFromLocation && canContinueFromLocation);

  const exitDetailsHref = isOwnerManualBooking
    ? getBusinessBookPath(businessSlug, {
        forOwner: true,
        entry: 'services',
        lang: bookingFlowLocale,
      })
    : getPublicBusinessProfilePath(businessSlug, {
        lang: bookingFlowLocale,
      });
  const exitDetailsLabel = isOwnerManualBooking
    ? ui.nav.backToServices
    : ui.serviceDetails.backToProfile;

  const backNavClassName = publicFlowBackNavClassName;

  const handleDetailsBack = () => {
    if (phase === 'location') {
      if (showAddOnSection) {
        setPhase('addons');
        return;
      }
      if (needsPriceStep) {
        setPhase('price');
        return;
      }
    }
    if (phase === 'addons' && needsPriceStep) {
      setPhase('price');
    }
  };

  const canGoBackWithinDetails =
    (phase === 'addons' && needsPriceStep) ||
    (phase === 'location' && (showAddOnSection || needsPriceStep));

  const stickyBackLabel =
    phase === 'location'
      ? showAddOnSection
        ? ui.nav.backToAddOns
        : needsPriceStep
          ? ui.serviceDetails.backToOptions
          : exitDetailsLabel
      : phase === 'addons' && needsPriceStep
        ? ui.serviceDetails.backToOptions
        : exitDetailsLabel;

  if (isNavigatingToCalendar) {
    return <BookCalendarLoadingSkeleton />;
  }

  return (
    <>
      <PublicFlowStickyBackHeader>
        {isOwnerManualBooking ? (
          <Link href={ROUTES.DASHBOARD.BOOKINGS} className={backNavClassName}>
            <PublicFlowBackNavLabel label={ui.nav.backToBookings} />
          </Link>
        ) : (
          <>
            {canGoBackWithinDetails ? (
              <button
                type="button"
                onClick={handleDetailsBack}
                className={backNavClassName}
              >
                <PublicFlowBackNavLabel label={stickyBackLabel} />
              </button>
            ) : (
              <Link href={exitDetailsHref} className={backNavClassName}>
                <PublicFlowBackNavLabel label={exitDetailsLabel} />
              </Link>
            )}
          </>
        )}
      </PublicFlowStickyBackHeader>

      <div className="flex flex-col min-h-[60vh] max-w-2xl mx-auto px-4 sm:px-6 pt-6 pb-16 sm:pb-24 w-full">
        <div className="flex-1 pb-28">
          {phase === 'price' && needsPriceStep && (
            <section className="mb-6">
              <h2 className="text-base font-semibold text-white mb-3">
                {ui.serviceDetails.choosePricingOption}
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

          {phase === 'location' && needsLocationStep && (
            <section className="mb-6">
              <BookingServiceLocationChoice
                value={customerServiceChoice}
                onChange={setCustomerServiceChoice}
                bookingFlowLocale={bookingFlowLocale}
                isOwnerManualBooking={isOwnerManualBooking}
              />
              {showShopIncompleteError ? (
                <p className="mt-3 text-sm text-red-400" role="alert">
                  {ui.serviceLocation.shopAddressIncomplete}
                </p>
              ) : null}
            </section>
          )}

          {phase !== 'location' ? (
            <section className="mb-8">
              <h2 className="mb-3 text-base font-semibold text-white">
                {ui.common.summary}
              </h2>
              <ServiceDetailsBookingSummary
                serviceName={service.name}
                servicePriceCents={basePriceCents}
                serviceDurationMinutes={baseDurationMinutes}
                selectedVariantLabel={selectedPriceOption?.label}
                selectedAddOns={selectedAddOns}
                totalCents={totalCents}
                serviceLabel={ui.common.service}
                addOnsLabel={ui.common.addOns}
                totalLabel={ui.common.total}
                bookingFlowLocale={bookingFlowLocale}
              />
            </section>
          ) : null}
        </div>

        <div
          className="fixed bottom-0 left-0 right-0 z-20 border-t border-white/10 bg-[var(--dashboard-bg)]/95 backdrop-blur-sm p-4 safe-area-pb"
          style={{ paddingBottom: 'max(1rem, env(safe-area-inset-bottom))' }}
        >
          <div
            className={`max-w-2xl mx-auto ${
              isOwnerManualBooking ? 'grid grid-cols-2 gap-3' : ''
            }`}
          >
            {isOwnerManualBooking ? (
              canGoBackWithinDetails ? (
                <Button
                  type="button"
                  variant="secondary"
                  fullWidth
                  className="font-semibold"
                  onClick={handleDetailsBack}
                >
                  {ui.common.back}
                </Button>
              ) : (
                <Button
                  href={exitDetailsHref}
                  variant="secondary"
                  fullWidth
                  className="font-semibold"
                >
                  {ui.common.back}
                </Button>
              )
            ) : null}

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

            {phase === 'price' && !showAddOnSection && needsLocationStep && (
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

            {phase === 'price' && !showAddOnSection && !needsLocationStep && (
              <>
                {showPrimaryAsLink ? (
                  <Button
                    href={calendarUrl}
                    onClick={() => setIsNavigatingToCalendar(true)}
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

            {phase === 'addons' && needsLocationStep && (
              <Button
                type="button"
                variant="inverse"
                fullWidth
                className="font-semibold"
                onClick={handleAddOnsContinue}
                icon={<ChevronRightIcon className="h-5 w-5" />}
                iconPosition="right"
              >
                {ui.serviceDetails.continue}
              </Button>
            )}

            {phase === 'addons' && !needsLocationStep && (
              <Button
                href={calendarUrl}
                onClick={() => setIsNavigatingToCalendar(true)}
                variant="inverse"
                fullWidth
                className="font-semibold"
                icon={<ChevronRightIcon className="h-5 w-5" />}
                iconPosition="right"
              >
                {ui.serviceDetails.dateAndTime}
              </Button>
            )}

            {phase === 'location' && (
              <>
                {showPrimaryAsLink ? (
                  <Button
                    href={calendarUrl}
                    onClick={() => setIsNavigatingToCalendar(true)}
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
          </div>
        </div>
      </div>
    </>
  );
}
