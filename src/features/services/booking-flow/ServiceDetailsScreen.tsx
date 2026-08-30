'use client';

import { Button, toast } from '@/components/shared';
import type { PublicBookingFlowLocale } from '@/constants/routes';
import {
  ROUTES,
  getBusinessBookPath,
  getBusinessBookScheduleUrl,
  getBusinessBookVisitUrl,
  getPublicBusinessProfilePath,
  type BookDetailsStepQuery,
  type BookServiceLocationTypeQuery,
} from '@/constants/routes';
import { PublicBookingPolicyAgreeDialog } from '@/features/availability/booking/components/BookingPolicyAgreeModal';
import { BookingServiceLocationChoice } from '@/features/availability/booking/components/BookingServiceLocationSteps';
import { usePublicBookingPolicyAgreement } from '@/features/availability/booking/hooks/usePublicBookingPolicyAgreement';
import { PublicBookingStepTracker } from '@/features/availability/booking/components/PublicBookingStepTracker';
import {
  isCustomerServiceLocationChoiceValid,
  type CustomerServiceChoice,
} from '@/features/availability/booking/utils/bookingServiceLocationFlow';
import {
  appendPublicBookingJob,
  clearPublicBookingJobsCart,
  loadPublicBookingJobsCart,
  replacePublicBookingVisitJob,
} from '@/features/availability/booking/utils/publicBookingJobsCart';
import { PUBLIC_BOOKING_MAX_JOBS } from '@/features/availability/booking/constants/publicBookingJobs';
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
import { useRouter } from 'next/navigation';
import { useCallback, useMemo, useState } from 'react';
import { BookCalendarLoadingSkeleton } from '@/features/availability/booking/components/BookCalendarLoadingSkeleton';
import { AddOnSelector } from './AddOnSelector';
import { PriceOptionSelector } from './PriceOptionSelector';
import { ServiceDetailsBookingSummary } from './ServiceDetailsBookingSummary';
import type { ServiceAddOn } from './types';

/**
 * Price options and add-ons are collapsed into a single `details` screen
 * (fewer full-screen hops for the customer); `location` (mobile vs shop)
 * stays separate since it's a real branching decision.
 */
type ServiceDetailsPhase = 'details' | 'location';

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
  /**
   * When true, append this service to the existing visit cart.
   * When false (default), clear any leftover cart and start a fresh visit.
   */
  addingAnotherJob?: boolean;
  /**
   * When true, replace the sole visit job and keep contact/schedule draft
   * (back from calendar → edit this service).
   */
  editingVisitJob?: boolean;
  bookingPolicy?: { text: string } | null;
}

function resolveInitialPhase(params: {
  needsPriceStep: boolean;
  needsLocationStep: boolean;
  initialDetailsStep?: BookDetailsStepQuery;
  hasValidPriceOption: boolean;
}): ServiceDetailsPhase {
  const {
    needsPriceStep,
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

  return 'details';
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
  addingAnotherJob = false,
  editingVisitJob = false,
  bookingPolicy = null,
}: ServiceDetailsScreenProps) {
  const router = useRouter();
  const ui = useMemo(
    () => publicBookingUi(bookingFlowLocale),
    [bookingFlowLocale]
  );
  const policyAgreement = usePublicBookingPolicyAgreement({
    businessSlug,
    policyText: bookingPolicy?.text,
    skip: isOwnerManualBooking,
    gateOnMount: !isOwnerManualBooking,
  });
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
    bookingFlowLocale,
    needsLocationStep,
    customerServiceChoice,
  ]);

  const calendarUrl = buildCalendarUrl();

  const commitPublicJobAndGoToVisit = useCallback(() => {
    const locationType =
      needsLocationStep &&
      (customerServiceChoice === 'mobile' || customerServiceChoice === 'shop')
        ? customerServiceChoice
        : undefined;

    const existing = loadPublicBookingJobsCart(businessSlug);
    // Only keep draft when the customer explicitly came back to edit
    // this visit's sole service — never on a fresh "new booking" start.
    const keepVisitDraft =
      editingVisitJob &&
      !addingAnotherJob &&
      (existing?.jobs.length ?? 0) === 1;

    if (!addingAnotherJob && !keepVisitDraft) {
      // Fresh booking — drop any leftover cart from prior visits.
      clearPublicBookingJobsCart(businessSlug);
    } else if (addingAnotherJob) {
      if ((existing?.jobs.length ?? 0) >= PUBLIC_BOOKING_MAX_JOBS) {
        toast.error(ui.multiJob.maxJobsReachedToast);
        return;
      }
    }

    const addOnMinutes = selectedAddOns.reduce(
      (sum, a) =>
        sum +
        (a.durationMinutes != null && a.durationMinutes > 0
          ? a.durationMinutes
          : 0),
      0
    );
    const job = {
      serviceId,
      serviceName: service.name,
      servicePriceOptionLabel: selectedPriceOption?.label ?? null,
      servicePriceCents: basePriceCents,
      selectedAddOns: selectedAddOns.map(a => ({
        id: a.id,
        name: a.name,
        priceCents: a.priceCents,
        durationMinutes: a.durationMinutes ?? undefined,
      })),
      durationMinutes: Math.max(1, baseDurationMinutes + addOnMinutes),
      vehicle: keepVisitDraft
        ? (existing!.jobs[0].vehicle ?? { year: '', make: '', model: '' })
        : { year: '', make: '', model: '' },
    };
    const result = keepVisitDraft
      ? replacePublicBookingVisitJob({
          businessSlug,
          serviceLocationType: locationType,
          job,
        })
      : appendPublicBookingJob({
          businessSlug,
          serviceLocationType: locationType,
          job,
        });
    if (!result.ok) {
      toast.error(
        result.reason === 'max_jobs'
          ? ui.multiJob.maxJobsReachedToast
          : ui.multiJob.couldNotAddServiceToast
      );
      return;
    }
    setIsNavigatingToCalendar(true);
    router.push(
      getBusinessBookVisitUrl(businessSlug, {
        serviceLocationType: locationType,
        lang: bookingFlowLocale,
      })
    );
  }, [
    addingAnotherJob,
    editingVisitJob,
    businessSlug,
    serviceId,
    service.name,
    selectedPriceOption?.label,
    basePriceCents,
    baseDurationMinutes,
    selectedAddOns,
    needsLocationStep,
    customerServiceChoice,
    bookingFlowLocale,
    router,
    ui.multiJob.maxJobsReachedToast,
    ui.multiJob.couldNotAddServiceToast,
  ]);

  const handleContinueToSchedule = () => {
    policyAgreement.runAfterAgreement(() => {
      if (isOwnerManualBooking) {
        setIsNavigatingToCalendar(true);
        router.push(calendarUrl);
        return;
      }
      commitPublicJobAndGoToVisit();
    });
  };

  const canContinueFromDetails =
    !needsPriceStep || Boolean(selectedPriceOptionId);
  const canContinueFromLocation = isCustomerServiceLocationChoiceValid(
    serviceLocation,
    customerServiceChoice
  );
  const showShopIncompleteError =
    needsLocationStep &&
    customerServiceChoice === 'shop' &&
    !serviceLocation.hasCompleteShopAddress;

  const exitDetailsHref = isOwnerManualBooking
    ? getBusinessBookPath(businessSlug, {
        forOwner: true,
        entry: 'services',
        lang: bookingFlowLocale,
      })
    : addingAnotherJob
      ? getBusinessBookPath(businessSlug, {
          lang: bookingFlowLocale,
          addJob: true,
        })
      : getPublicBusinessProfilePath(businessSlug, {
          lang: bookingFlowLocale,
        });
  const exitDetailsLabel = isOwnerManualBooking
    ? ui.nav.backToServices
    : addingAnotherJob
      ? ui.nav.backToServices
      : ui.serviceDetails.backToProfile;

  const backNavClassName = publicFlowBackNavClassName;

  const handleDetailsBack = () => {
    if (phase === 'location') {
      setPhase('details');
    }
  };

  const handleDetailsContinue = () => {
    if (!canContinueFromDetails) return;
    if (needsLocationStep) {
      setPhase('location');
      return;
    }
    handleContinueToSchedule();
  };

  const canGoBackWithinDetails = phase === 'location';

  const stickyBackLabel =
    phase === 'location' ? ui.serviceDetails.backToOptions : exitDetailsLabel;

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
          {!isOwnerManualBooking ? (
            <PublicBookingStepTracker
              currentStage="service"
              labels={ui.stepTracker}
            />
          ) : null}
          {phase === 'details' && needsPriceStep && (
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

          {phase === 'details' &&
            showAddOnSection &&
            (!needsPriceStep || Boolean(selectedPriceOptionId)) && (
              <section className="mb-6">
                <h2 className="text-base font-semibold text-white mb-3">
                  {ui.serviceDetails.optionalAddOns}
                </h2>
                <AddOnSelector
                  addOns={addOns as ServiceAddOn[]}
                  selectedIds={selectedAddOnIds}
                  onToggle={handleToggleAddOn}
                  labels={{
                    seeDescription: ui.serviceDetails.seeDescription,
                    hideDescription: ui.serviceDetails.hideDescription,
                  }}
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
                coverageLabel={serviceLocation.coverageLabel}
                shopAddressLabel={serviceLocation.shopAddressLabel}
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

            {phase === 'details' && (
              <Button
                type="button"
                variant="inverse"
                fullWidth
                className="font-semibold"
                disabled={!canContinueFromDetails}
                onClick={handleDetailsContinue}
                icon={<ChevronRightIcon className="h-5 w-5" />}
                iconPosition="right"
              >
                {ui.serviceDetails.continue}
              </Button>
            )}

            {phase === 'location' && (
              <Button
                type="button"
                variant="inverse"
                fullWidth
                className="font-semibold"
                disabled={!canContinueFromLocation}
                onClick={handleContinueToSchedule}
                icon={<ChevronRightIcon className="h-5 w-5" />}
                iconPosition="right"
              >
                {ui.serviceDetails.continue}
              </Button>
            )}
          </div>
        </div>
      </div>
      <PublicBookingPolicyAgreeDialog
        isOpen={policyAgreement.modalOpen}
        required={policyAgreement.required}
        policyText={policyAgreement.policyText}
        onClose={policyAgreement.dismiss}
        onAgreed={policyAgreement.agree}
        bookingFlowLocale={bookingFlowLocale}
      />
    </>
  );
}
