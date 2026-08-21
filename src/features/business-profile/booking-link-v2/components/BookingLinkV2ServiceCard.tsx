'use client';

import { ImageWithFallback } from '@/components/shared';
import type { PublicBookingFlowLocale } from '@/constants/routes';
import { getBusinessBookDetailsPath } from '@/constants/routes';
import { formatDurationMinutes } from '@/features/availability/booking/utils/formatDuration';
import type { PublicActiveSale } from '@/features/marketing/types/publicActiveSale';
import { getServiceSalePriceCents } from '@/features/marketing/utils/getServiceSalePriceCents';
import { getServiceImageUrl } from '@/features/services/utils/serviceImageUrl';
import { publicBookingUi } from '@/libs/i18n/publicBookingUi';
import Link from 'next/link';
import React from 'react';
import {
  bookingLinkV2CardClassName,
  bookingLinkV2CtaClassName,
} from '../utils/bookingLinkV2Surface';
import { getBookingLinkV2MockServiceImage } from '../utils/serviceCardImage';

interface BookingLinkV2ServiceCardProps {
  service: {
    id?: string;
    name: string;
    price: number;
    hours_to_complete?: number | null;
    duration_minutes?: number | null;
    priceOptionsEnabled?: boolean;
    image_path?: string | null;
  };
  isPublic?: boolean;
  businessSlug?: string;
  hideBookLink?: boolean;
  onBrowse?: () => void;
  bookingFlowLocale?: PublicBookingFlowLocale;
  publicActiveSale?: PublicActiveSale | null;
}

function formatPrice(cents: number, contactLabel: string): string {
  if (cents === 0) return contactLabel;
  return `$${(cents / 100).toFixed(0)}`;
}

export function BookingLinkV2ServiceCard({
  service,
  isPublic = false,
  businessSlug = '',
  hideBookLink = false,
  onBrowse,
  bookingFlowLocale = 'en',
  publicActiveSale = null,
}: BookingLinkV2ServiceCardProps) {
  const ui = publicBookingUi(bookingFlowLocale);
  const imageSrc =
    getServiceImageUrl(service) ?? getBookingLinkV2MockServiceImage(service.id);

  const effectiveDurationMinutes =
    service.duration_minutes != null && service.duration_minutes > 0
      ? service.duration_minutes
      : service.hours_to_complete != null && service.hours_to_complete > 0
        ? Math.round(service.hours_to_complete * 60)
        : null;

  const durationLabel = effectiveDurationMinutes
    ? formatDurationMinutes(effectiveDurationMinutes, bookingFlowLocale)
    : null;

  const showFrom = service.priceOptionsEnabled === true && service.price > 0;

  const salePrice =
    publicActiveSale && service.price > 0
      ? getServiceSalePriceCents(service.price, publicActiveSale)
      : null;

  const canBrowse =
    !hideBookLink && Boolean(businessSlug) && Boolean(service.id);
  const canBook = isPublic && canBrowse;

  const href =
    canBook && !onBrowse && service.id
      ? getBusinessBookDetailsPath(businessSlug, service.id, {
          lang: bookingFlowLocale,
        })
      : null;

  const displayCents = salePrice ? salePrice.saleCents : service.price;
  const formattedPrice = formatPrice(
    displayCents,
    ui.serviceCard.contactForQuote
  );
  const isQuote = displayCents === 0;

  const body = (
    <>
      <div className="relative h-[108px] w-[108px] shrink-0 overflow-hidden rounded-[16px] bg-zinc-800 sm:h-[116px] sm:w-[116px]">
        <ImageWithFallback
          src={imageSrc}
          alt=""
          width={232}
          height={232}
          className="h-full w-full object-cover"
          fallbackLabel={service.name}
          fallbackSize={{ w: 232, h: 232 }}
          sizes="116px"
        />
      </div>

      <div className="flex min-h-[108px] min-w-0 flex-1 flex-col justify-between py-0.5 sm:min-h-[116px]">
        <div className="min-w-0 space-y-0.5">
          <p className="line-clamp-2 text-[16px] font-semibold leading-snug tracking-tight text-white">
            {service.name}
          </p>
          {durationLabel ? (
            <p className="truncate text-[13px] text-zinc-500">{durationLabel}</p>
          ) : null}
        </div>

        <div className="flex items-end justify-between gap-3">
          <div className="min-w-0">
            {isQuote ? (
              <p className="text-sm font-medium text-zinc-400">
                {ui.serviceCard.contactForQuote}
              </p>
            ) : (
              <>
                {showFrom ? (
                  <p className="text-[11px] font-medium leading-none text-zinc-500">
                    {ui.serviceCard.from}
                  </p>
                ) : null}
                <div
                  className={`flex items-baseline gap-1.5 ${showFrom ? 'mt-0.5' : ''}`}
                >
                  <span className="text-[18px] font-semibold tabular-nums tracking-tight text-white">
                    {formattedPrice}
                  </span>
                  {salePrice ? (
                    <span className="text-sm font-medium text-zinc-500 line-through decoration-zinc-500/70 tabular-nums">
                      {formatPrice(
                        salePrice.originalCents,
                        ui.serviceCard.contactForQuote
                      )}
                    </span>
                  ) : null}
                </div>
              </>
            )}
          </div>

          {canBook ? (
            <span className={bookingLinkV2CtaClassName}>
              {ui.serviceCard.bookNow}
            </span>
          ) : null}
        </div>
      </div>
    </>
  );

  const cardClassName = `flex w-full items-stretch gap-3 p-2.5 sm:gap-3.5 sm:p-3 ${bookingLinkV2CardClassName}`;

  if (onBrowse && canBrowse) {
    return (
      <button
        type="button"
        onClick={onBrowse}
        className={`${cardClassName} cursor-pointer transition-opacity active:opacity-80`}
      >
        {body}
      </button>
    );
  }

  if (href) {
    return (
      <Link
        href={href}
        className={`${cardClassName} cursor-pointer transition-opacity active:opacity-80`}
      >
        {body}
      </Link>
    );
  }

  return <div className={cardClassName}>{body}</div>;
}
