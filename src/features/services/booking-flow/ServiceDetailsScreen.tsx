'use client';

import { Button } from '@/components/shared';
import {
  OWNER_MANUAL_BOOKING_FOR,
  getBusinessBookPath,
  type BookDetailsStepQuery,
} from '@/constants/routes';
import { formatDurationMinutes } from '@/features/availability/booking/utils/formatDuration';
import type {
  AddOnForBooking,
  PriceOptionForBooking,
  ServiceForBooking,
} from '@/features/services/api/getServiceWithAddOnsForBooking';
import { ArrowLeftIcon, ChevronRightIcon } from '@heroicons/react/24/outline';
import Link from 'next/link';
import React from 'react';
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
}

function formatPrice(cents: number): string {
  return `$${(cents / 100).toFixed(0)}`;
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
}: ServiceDetailsScreenProps) {
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
    const searchParams = new URLSearchParams();
    searchParams.set('serviceId', serviceId);
    if (needsPriceStep && selectedPriceOptionId) {
      searchParams.set('priceOptionId', selectedPriceOptionId);
    }
    if (selectedAddOnIds.size > 0) {
      searchParams.set('addOnIds', Array.from(selectedAddOnIds).join(','));
    }
    if (isOwnerManualBooking) {
      searchParams.set('for', OWNER_MANUAL_BOOKING_FOR);
    }
    searchParams.set('detailsStep', phase === 'addons' ? 'addons' : 'price');
    return `/${businessSlug}/book?${searchParams.toString()}`;
  }, [
    businessSlug,
    serviceId,
    needsPriceStep,
    selectedPriceOptionId,
    selectedAddOnIds,
    isOwnerManualBooking,
    phase,
  ]);

  const calendarUrl = buildCalendarUrl();

  const canContinueFromPrice = Boolean(selectedPriceOptionId);
  const showAddOnSection = addOns.length > 0;

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
    ? getBusinessBookPath(businessSlug, { forOwner: true })
    : `/${businessSlug}`;
  const exitDetailsLabel = isOwnerManualBooking
    ? 'Back to services'
    : 'Back to profile';

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
              <ArrowLeftIcon className="h-5 w-5" />
              <span className="text-sm font-medium">Back to options</span>
            </button>
          ) : (
            <Link
              href={exitDetailsHref}
              className="inline-flex items-center gap-2 text-gray-400 hover:text-white transition-colors"
            >
              <ArrowLeftIcon className="h-5 w-5" />
              <span className="text-sm font-medium">{exitDetailsLabel}</span>
            </Link>
          )}
        </div>
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
                    {formatDurationMinutes(durationForHeader)}
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
                    Starting at {formatPrice(service.priceCents)}
                  </span>
                ) : (
                  <span className="text-sm text-zinc-300 tabular-nums">
                    {formatPrice(basePriceCents)}
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
                Choose an option
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
                Optional add-ons
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
                Continue
              </Button>
            )}

            {phase === 'price' && showPrimaryAsLink && (
              <Button
                href={primaryButtonHref}
                variant="inverse"
                fullWidth
                className="font-semibold"
                icon={<ChevronRightIcon className="h-5 w-5" />}
                iconPosition="right"
              >
                Date & time
              </Button>
            )}

            {phase === 'addons' && (
              <Button
                href={calendarUrl}
                variant="inverse"
                fullWidth
                className="font-semibold"
                icon={<ChevronRightIcon className="h-5 w-5" />}
                iconPosition="right"
              >
                Date & time
              </Button>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
