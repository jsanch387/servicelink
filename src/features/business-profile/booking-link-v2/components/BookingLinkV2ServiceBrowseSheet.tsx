'use client';

import { Button, ImageWithFallback, Modal } from '@/components/shared';
import type { PublicBookingFlowLocale } from '@/constants/routes';
import { getBusinessBookDetailsUrl } from '@/constants/routes';
import { formatDurationMinutes } from '@/features/availability/booking/utils/formatDuration';
import { ServiceDescriptionFormatted } from '@/features/business-profile/components/ServiceDescriptionFormatted';
import { useServiceDescriptionClamp } from '@/features/business-profile/hooks/useServiceDescriptionClamp';
import { getServiceImageUrl } from '@/features/services/utils/serviceImageUrl';
import { publicBookingUi } from '@/libs/i18n/publicBookingUi';
import { useRouter } from 'next/navigation';
import React, { useEffect, useState } from 'react';
import type { PublicServicePriceOption } from '../types/publicServicePriceOption';
import { getBookingLinkV2MockServiceImage } from '../utils/serviceCardImage';

export interface BookingLinkV2BrowseService {
  id: string;
  name: string;
  description?: string | null;
  price: number;
  duration_minutes?: number | null;
  hours_to_complete?: number | null;
  priceOptionsEnabled?: boolean;
  image_path?: string | null;
}

interface BookingLinkV2ServiceBrowseSheetProps {
  service: BookingLinkV2BrowseService | null;
  businessSlug: string;
  bookingFlowLocale?: PublicBookingFlowLocale;
  onClose: () => void;
}

function formatPrice(cents: number): string {
  if (cents === 0) return '—';
  return `$${(cents / 100).toLocaleString('en-US', {
    maximumFractionDigits: 0,
  })}`;
}

function serviceDurationLabel(
  service: BookingLinkV2BrowseService,
  locale: PublicBookingFlowLocale
): string | null {
  const minutes =
    service.duration_minutes != null && service.duration_minutes > 0
      ? service.duration_minutes
      : service.hours_to_complete != null && service.hours_to_complete > 0
        ? Math.round(service.hours_to_complete * 60)
        : null;
  return minutes ? formatDurationMinutes(minutes, locale) : null;
}

const PRICE_OPTION_SKELETON_ROWS = [
  { label: 'w-[42%]', duration: 'w-14', price: 'w-12' },
  { label: 'w-[36%]', duration: 'w-16', price: 'w-10' },
  { label: 'w-[48%]', duration: 'w-12', price: 'w-14' },
] as const;

function PriceOptionRowsSkeleton({ heading }: { heading: string }) {
  return (
    <div aria-busy="true" aria-live="polite" aria-label={heading}>
      <div className="mb-3 h-4 w-40 animate-pulse rounded bg-white/10" />
      <div className="space-y-2" aria-hidden>
        {PRICE_OPTION_SKELETON_ROWS.map((row, index) => (
          <div
            key={index}
            className="flex items-center justify-between rounded-2xl bg-white/[0.06] px-4 py-3.5 ring-1 ring-white/10"
          >
            <div className="space-y-1.5">
              <div
                className={`h-3.5 ${row.label} animate-pulse rounded bg-white/[0.12]`}
              />
              <div
                className={`h-2.5 ${row.duration} animate-pulse rounded bg-white/[0.08]`}
              />
            </div>
            <div
              className={`h-4 ${row.price} animate-pulse rounded bg-white/[0.12]`}
            />
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
  const durationLabel = service
    ? serviceDurationLabel(service, bookingFlowLocale)
    : null;
  const fullImageSrc = service
    ? (getServiceImageUrl(service) ??
      getBookingLinkV2MockServiceImage(service.id))
    : '';
  const imageSrc = service
    ? (getServiceImageUrl(service, { width: 960, quality: 72 }) ??
      fullImageSrc)
    : '';
  const showFrom = service?.priceOptionsEnabled === true && service.price > 0;
  const basePriceLabel =
    service && service.price > 0 ? formatPrice(service.price) : null;

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
      titleClassName="line-clamp-2 text-[17px] sm:text-xl"
      presentation="default"
      maxWidth="lg"
      uniformHorizontalPadding16
      showCloseButton
      closeAriaLabel={ui.serviceDetails.closeSheetAriaLabel}
      panelClassName="sm:border-white/[0.12]"
      panelHeightClassName="h-[92dvh] max-h-[92dvh] sm:h-auto sm:max-h-[min(640px,88dvh)]"
      contentClassName="pt-4 pb-4 sm:pt-5 sm:pb-5"
      footer={
        <div className="sm:flex sm:justify-end">
          <Button
            type="button"
            variant="inverse"
            size="md"
            fullWidth
            className="font-semibold sm:w-auto sm:min-w-[200px] sm:px-8"
            disabled={!canStart}
            onClick={handleStartBooking}
          >
            {ui.serviceDetails.startBooking}
          </Button>
        </div>
      }
    >
      {service ? (
        <div className="space-y-4">
          {imageSrc ? (
            <div className="relative h-36 overflow-hidden rounded-[14px] bg-zinc-800 sm:h-40">
              <ImageWithFallback
                src={imageSrc}
                retrySrc={fullImageSrc}
                alt=""
                width={960}
                height={600}
                className="absolute inset-0 h-full w-full object-cover"
                fallbackLabel={service.name}
                fallbackSize={{ w: 960, h: 600 }}
                sizes="(max-width: 640px) 100vw, 512px"
                priority
              />
            </div>
          ) : null}

          {durationLabel || basePriceLabel ? (
            <p className="text-[15px] leading-6 text-zinc-400">
              {durationLabel ? <span>{durationLabel}</span> : null}
              {durationLabel && basePriceLabel ? (
                <span aria-hidden className="px-1.5 text-zinc-600">
                  ·
                </span>
              ) : null}
              {basePriceLabel ? (
                <span className="font-medium tabular-nums text-zinc-200">
                  {showFrom ? `${ui.serviceCard.from} ` : null}
                  {basePriceLabel}
                </span>
              ) : null}
            </p>
          ) : null}

          {description ? (
            <div>
              <div className="relative">
                <div
                  ref={descriptionClampRef}
                  className={
                    isDescriptionExpanded
                      ? ''
                      : 'max-h-[5.5rem] overflow-hidden'
                  }
                >
                  <ServiceDescriptionFormatted
                    description={description}
                    className="text-sm leading-relaxed text-zinc-400"
                  />
                </div>
                {!isDescriptionExpanded && isTruncatable ? (
                  <div
                    className="pointer-events-none absolute inset-x-0 bottom-0 h-7 bg-gradient-to-t from-[var(--dashboard-bg)] to-transparent"
                    aria-hidden
                  />
                ) : null}
              </div>
              {showDescriptionToggle ? (
                <button
                  type="button"
                  onClick={() => setIsDescriptionExpanded(prev => !prev)}
                  className="mt-2 inline-flex cursor-pointer text-sm font-medium text-white hover:text-zinc-200"
                  aria-expanded={isDescriptionExpanded}
                >
                  {isDescriptionExpanded
                    ? ui.serviceCard.seeLess
                    : ui.serviceCard.seeMore}
                </button>
              ) : null}
            </div>
          ) : null}

          {isLoadingOptions ? (
            <PriceOptionRowsSkeleton
              heading={ui.serviceDetails.choosePricingOption}
            />
          ) : needsOption ? (
            <div>
              <p className="mb-3 text-sm font-semibold text-white">
                {ui.serviceDetails.choosePricingOption}
              </p>
              <div
                className="space-y-2"
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
                      className={`flex w-full cursor-pointer items-center justify-between gap-4 rounded-2xl px-4 py-3.5 text-left transition-colors ${
                        selected
                          ? 'bg-white text-black'
                          : 'bg-white/[0.06] text-white ring-1 ring-white/10 hover:bg-white/[0.1]'
                      }`}
                    >
                      <span className="min-w-0">
                        <span className="block text-sm font-semibold leading-snug">
                          {option.label}
                        </span>
                        <span
                          className={`mt-0.5 block text-[13px] ${
                            selected ? 'text-black/55' : 'text-zinc-500'
                          }`}
                        >
                          {formatDurationMinutes(
                            option.durationMinutes,
                            bookingFlowLocale
                          )}
                        </span>
                      </span>
                      <span className="shrink-0 text-[15px] font-semibold tabular-nums">
                        {formatPrice(option.priceCents)}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          ) : null}
        </div>
      ) : null}
    </Modal>
  );
}
