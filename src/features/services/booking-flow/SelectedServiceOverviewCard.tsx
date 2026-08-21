'use client';

import { ImageWithFallback } from '@/components/shared';
import type { PublicBookingFlowLocale } from '@/constants/routes';
import { formatDurationMinutes } from '@/features/availability/booking/utils/formatDuration';
import { ServiceDescriptionFormatted } from '@/features/business-profile/components/ServiceDescriptionFormatted';
import type { ServiceForBooking } from '@/features/services/api/getServiceWithAddOnsForBooking';
import { getBookingLinkV2MockServiceImage } from '@/features/business-profile/booking-link-v2/utils/serviceCardImage';
import { getServiceImageUrl } from '@/features/services/utils/serviceImageUrl';
import { publicBookingUi } from '@/libs/i18n/publicBookingUi';
import React from 'react';

interface SelectedServiceOverviewCardProps {
  service: ServiceForBooking;
  bookingFlowLocale?: PublicBookingFlowLocale;
}

function formatPrice(cents: number, contactLabel: string): string {
  if (cents === 0) return contactLabel;
  return `$${(cents / 100).toFixed(0)}`;
}

export function SelectedServiceOverviewCard({
  service,
  bookingFlowLocale = 'en',
}: SelectedServiceOverviewCardProps) {
  const ui = publicBookingUi(bookingFlowLocale);
  const imageSrc =
    getServiceImageUrl({ image_path: service.imagePath }) ??
    getBookingLinkV2MockServiceImage(service.id);
  const durationLabel =
    service.durationMinutes > 0
      ? formatDurationMinutes(service.durationMinutes, bookingFlowLocale)
      : null;
  const showFrom = service.priceOptionsEnabled && service.priceCents > 0;
  const formattedPrice = formatPrice(
    service.priceCents,
    ui.serviceCard.contactForQuote
  );
  const description = service.description?.trim() || '';

  return (
    <div className="overflow-hidden rounded-2xl bg-[#121212] text-left ring-1 ring-white/8">
      <div className="flex items-stretch gap-3.5 p-2.5 sm:gap-4 sm:p-3">
        <div className="relative h-[108px] w-[108px] shrink-0 overflow-hidden rounded-[14px] bg-zinc-800 sm:h-[116px] sm:w-[116px]">
          <ImageWithFallback
            src={imageSrc ?? undefined}
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
          <div className="min-w-0">
            <p className="line-clamp-2 text-[16px] font-semibold leading-snug tracking-tight text-white">
              {service.name}
            </p>
            {durationLabel ? (
              <p className="mt-1.5 truncate text-[13px] text-zinc-500">
                {durationLabel}
              </p>
            ) : null}
          </div>

          <div className="mt-3">
            {showFrom ? (
              <p className="text-[11px] font-medium leading-none text-zinc-500">
                {ui.serviceCard.from}
              </p>
            ) : null}
            <p
              className={`text-[18px] font-semibold tabular-nums tracking-tight text-white ${
                showFrom ? 'mt-1' : ''
              }`}
            >
              {formattedPrice}
            </p>
          </div>
        </div>
      </div>

      {description ? (
        <div className="border-t border-white/8 px-3.5 py-3.5 sm:px-4">
          <ServiceDescriptionFormatted
            description={description}
            className="text-sm leading-relaxed text-zinc-400"
          />
        </div>
      ) : null}
    </div>
  );
}
