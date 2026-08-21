'use client';

import { Button, Modal } from '@/components/shared';
import type { PublicBookingFlowLocale } from '@/constants/routes';
import { getBusinessBookDetailsUrl } from '@/constants/routes';
import { formatDurationMinutes } from '@/features/availability/booking/utils/formatDuration';
import { ServiceDescriptionFormatted } from '@/features/business-profile/components/ServiceDescriptionFormatted';
import { useServiceDescriptionClamp } from '@/features/business-profile/hooks/useServiceDescriptionClamp';
import { publicBookingUi } from '@/libs/i18n/publicBookingUi';
import { useRouter } from 'next/navigation';
import React, { useEffect, useState } from 'react';
import type { PublicServicePriceOption } from '../types/publicServicePriceOption';

export interface BookingLinkV2BrowseService {
  id: string;
  name: string;
  description?: string | null;
  price: number;
  duration_minutes?: number | null;
  hours_to_complete?: number | null;
  priceOptionsEnabled?: boolean;
}

interface BookingLinkV2ServiceBrowseSheetProps {
  service: BookingLinkV2BrowseService | null;
  businessSlug: string;
  bookingFlowLocale?: PublicBookingFlowLocale;
  onClose: () => void;
}

function formatPrice(cents: number): string {
  if (cents === 0) return '—';
  return `$${(cents / 100).toFixed(0)}`;
}

const PRICE_OPTION_SKELETON_TILES = [
  { label: 'w-[72%]', duration: 'w-14', price: 'w-12' },
  { label: 'w-[58%]', duration: 'w-16', price: 'w-10' },
  { label: 'w-[64%]', duration: 'w-12', price: 'w-14' },
  { label: 'w-[50%]', duration: 'w-14', price: 'w-11' },
] as const;

function PriceOptionTilesSkeleton({ heading }: { heading: string }) {
  return (
    <div aria-busy="true" aria-live="polite" aria-label={heading}>
      <div className="mb-3 h-4 w-40 animate-pulse rounded bg-white/10" />
      <div className="grid grid-cols-2 gap-2.5" aria-hidden>
        {PRICE_OPTION_SKELETON_TILES.map((tile, index) => (
          <div
            key={index}
            className="flex min-h-[92px] flex-col items-start justify-between rounded-2xl bg-white/[0.06] px-3.5 py-3 ring-1 ring-white/10"
          >
            <div
              className={`h-3.5 ${tile.label} animate-pulse rounded bg-white/[0.12]`}
            />
            <div className="mt-3 w-full space-y-1.5">
              <div
                className={`h-2.5 ${tile.duration} animate-pulse rounded bg-white/[0.08]`}
              />
              <div
                className={`h-4 ${tile.price} animate-pulse rounded bg-white/[0.12]`}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export function BookingLinkV2ServiceBrowseSheet({
  service,
  businessSlug,
  bookingFlowLocale = 'en',
  onClose,
}: BookingLinkV2ServiceBrowseSheetProps) {
  const router = useRouter();
  const ui = publicBookingUi(bookingFlowLocale);
  const [options, setOptions] = useState<PublicServicePriceOption[]>([]);
  const [isLoadingOptions, setIsLoadingOptions] = useState(false);
  const [selectedOptionId, setSelectedOptionId] = useState<string | null>(null);
  const [isDescriptionExpanded, setIsDescriptionExpanded] = useState(false);
  const description = service?.description?.trim() ?? '';
  const { ref: descriptionClampRef, isTruncatable } =
    useServiceDescriptionClamp(description, isDescriptionExpanded);
  const showDescriptionToggle = isTruncatable || isDescriptionExpanded;

  useEffect(() => {
    if (!service) {
      setOptions([]);
      setSelectedOptionId(null);
      setIsLoadingOptions(false);
      return;
    }

    setSelectedOptionId(null);
    setIsDescriptionExpanded(false);

    if (!service.priceOptionsEnabled) {
      setOptions([]);
      setIsLoadingOptions(false);
      return;
    }

    let cancelled = false;
    setIsLoadingOptions(true);

    fetch(
      `/api/public/profile/${encodeURIComponent(businessSlug)}/service-price-options?serviceId=${encodeURIComponent(service.id)}`
    )
      .then(async response => {
        const json = (await response.json()) as {
          success?: boolean;
          options?: PublicServicePriceOption[];
        };
        if (cancelled) return;
        setOptions(json.success === true ? (json.options ?? []) : []);
      })
      .catch(() => {
        if (!cancelled) setOptions([]);
      })
      .finally(() => {
        if (!cancelled) setIsLoadingOptions(false);
      });

    return () => {
      cancelled = true;
    };
  }, [businessSlug, service]);

  const needsOption = options.length > 0;
  const canStart =
    Boolean(service) &&
    !isLoadingOptions &&
    (!needsOption || Boolean(selectedOptionId));

  const handleStartBooking = () => {
    if (!service || !canStart) return;
    router.push(
      getBusinessBookDetailsUrl(businessSlug, {
        serviceId: service.id,
        priceOptionId: selectedOptionId ?? undefined,
        detailsStep: 'addons',
        lang: bookingFlowLocale,
      })
    );
  };

  return (
    <Modal
      isOpen={Boolean(service)}
      onClose={onClose}
      title={service?.name ?? ''}
      titleClassName="line-clamp-2"
      presentation="sheet"
      maxWidth="lg"
      uniformHorizontalPadding16
      showCloseButton
      closeAriaLabel={ui.serviceDetails.closeSheetAriaLabel}
      panelHeightClassName="h-[95dvh] max-h-[95dvh] sm:h-auto sm:max-h-[min(720px,90dvh)]"
      contentClassName="pt-4 pb-4 sm:pt-5 sm:pb-5"
      footer={
        <Button
          type="button"
          variant="inverse"
          size="md"
          fullWidth
          className="font-semibold"
          disabled={!canStart}
          onClick={handleStartBooking}
        >
          {ui.serviceDetails.startBooking}
        </Button>
      }
    >
      {service ? (
        <div className="space-y-5">
          {isLoadingOptions ? (
            <PriceOptionTilesSkeleton
              heading={ui.serviceDetails.choosePricingOption}
            />
          ) : needsOption ? (
            <div>
              <p className="mb-3 text-sm font-semibold text-white">
                {ui.serviceDetails.choosePricingOption}
              </p>
              <div
                className="grid grid-cols-2 gap-2.5"
                role="radiogroup"
                aria-label={ui.serviceDetails.choosePricingOption}
              >
                {options.map(option => {
                  const selected = selectedOptionId === option.id;
                  return (
                    <button
                      key={option.id}
                      type="button"
                      role="radio"
                      aria-checked={selected}
                      onClick={() => setSelectedOptionId(option.id)}
                      className={`flex min-h-[92px] cursor-pointer flex-col items-start justify-between rounded-2xl px-3.5 py-3 text-left transition-colors ${
                        selected
                          ? 'bg-white text-black'
                          : 'bg-white/[0.06] text-white ring-1 ring-white/10 hover:bg-white/[0.1]'
                      }`}
                    >
                      <span className="text-sm font-semibold leading-snug">
                        {option.label}
                      </span>
                      <span className="mt-3 w-full">
                        <span
                          className={`block text-[12px] ${
                            selected ? 'text-black/55' : 'text-zinc-500'
                          }`}
                        >
                          {formatDurationMinutes(
                            option.durationMinutes,
                            bookingFlowLocale
                          )}
                        </span>
                        <span className="mt-0.5 block text-[15px] font-semibold tabular-nums">
                          {formatPrice(option.priceCents)}
                        </span>
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          ) : null}

          {description ? (
            <div>
              <div
                ref={descriptionClampRef}
                className={
                  isDescriptionExpanded
                    ? ''
                    : 'max-h-[7.625rem] overflow-hidden sm:max-h-none sm:overflow-visible'
                }
              >
                <ServiceDescriptionFormatted
                  description={description}
                  className="text-sm leading-relaxed text-zinc-400"
                />
              </div>
              {showDescriptionToggle ? (
                <button
                  type="button"
                  onClick={() => setIsDescriptionExpanded(prev => !prev)}
                  className="mt-2 inline-flex cursor-pointer text-sm font-medium text-white hover:text-zinc-200 sm:hidden"
                  aria-expanded={isDescriptionExpanded}
                >
                  {isDescriptionExpanded
                    ? ui.serviceCard.seeLess
                    : ui.serviceCard.seeMore}
                </button>
              ) : null}
            </div>
          ) : null}
        </div>
      ) : null}
    </Modal>
  );
}
