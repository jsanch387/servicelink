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
  bookingLinkV2BookButtonClassName,
  bookingLinkV2ServiceRowClassName,
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
  priority?: boolean;
}

function formatPrice(cents: number, contactLabel: string): string {
  if (cents === 0) return contactLabel;
  return `$${(cents / 100).toLocaleString('en-US', {
    maximumFractionDigits: 0,
  })}`;
}

export function BookingLinkV2ServiceCard({
  service,
  isPublic = false,
  businessSlug = '',
  hideBookLink = false,
  onBrowse,
  bookingFlowLocale = 'en',
  publicActiveSale = null,
  priority = false,
}: BookingLinkV2ServiceCardProps) {
  const ui = publicBookingUi(bookingFlowLocale);
  const fullImageSrc =
    getServiceImageUrl(service) ?? getBookingLinkV2MockServiceImage(service.id);
  const imageSrc =
    getServiceImageUrl(service, { width: 320, quality: 70 }) ?? fullImageSrc;

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
      <div className="relative h-24 w-24 shrink-0 overflow-hidden rounded-[12px] bg-zinc-800 sm:h-[6.5rem] sm:w-[6.5rem] sm:rounded-[14px]">
        <ImageWithFallback
          src={imageSrc}
          retrySrc={fullImageSrc}
          alt=""
          width={220}
          height={220}
          className="h-full w-full object-cover"
          fallbackLabel={service.name}
          fallbackSize={{ w: 220, h: 220 }}
          sizes="(max-width: 640px) 96px, 104px"
          priority={priority}
        />
      </div>

      <div className="flex min-h-24 min-w-0 flex-1 flex-col justify-between sm:min-h-[6.5rem]">
        <div>
          <p className="line-clamp-2 text-[17px] font-semibold leading-snug tracking-tight text-white">
            {service.name}
          </p>
          {durationLabel ? (
            <p className="mt-0.5 text-[15px] leading-5 text-zinc-500">
              {durationLabel}
            </p>
          ) : null}
        </div>
        <div className="flex items-center justify-between gap-3">
          <p className="min-w-0 text-[15px] leading-5">
            {isQuote ? (
              <span className="text-zinc-500">
                {ui.serviceCard.contactForQuote}
              </span>
            ) : (
              <span>
                {showFrom ? (
                  <span className="text-zinc-500">{ui.serviceCard.from} </span>
                ) : null}
                <span className="font-medium tabular-nums text-zinc-300">
                  {formattedPrice}
                </span>
                {salePrice ? (
                  <span className="ml-1.5 text-zinc-600 line-through decoration-zinc-600 tabular-nums">
                    {formatPrice(
                      salePrice.originalCents,
                      ui.serviceCard.contactForQuote
                    )}
                  </span>
                ) : null}
              </span>
            )}
          </p>
          {canBook ? (
            <span className={bookingLinkV2BookButtonClassName}>
              {ui.serviceCard.book}
            </span>
          ) : null}
        </div>
      </div>
    </>
  );

  const rowClassName = bookingLinkV2ServiceRowClassName;
  const interactiveClassName = `${rowClassName} cursor-pointer transition-colors hover:bg-white/[0.07] active:bg-white/[0.09]`;

  if (onBrowse && canBrowse) {
    return (
      <button type="button" onClick={onBrowse} className={interactiveClassName}>
        {body}
      </button>
    );
  }

  if (href) {
    return (
      <Link href={href} className={interactiveClassName}>
        {body}
      </Link>
    );
  }

  return <div className={rowClassName}>{body}</div>;
}
