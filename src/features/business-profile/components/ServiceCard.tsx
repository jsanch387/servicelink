'use client';

import { Button, GlassCard } from '@/components/shared';
import type { PublicBookingFlowLocale } from '@/constants/routes';
import { getBusinessBookDetailsPath } from '@/constants/routes';
import { formatDurationMinutes } from '@/features/availability/booking/utils/formatDuration';
import { publicBookingUi } from '@/libs/i18n/publicBookingUi';
import {
  ChevronDownIcon,
  ChevronRightIcon,
  ChevronUpIcon,
  ClockIcon,
} from '@heroicons/react/24/outline';
import Link from 'next/link';
import React, { useState } from 'react';
import { serviceDescriptionNeedsSeeMore } from '../utils/serviceDescriptionDisplay';

interface Service {
  id?: string;
  name: string;
  price: string | number;
  description: string;
  hours_to_complete?: number | null;
  duration_minutes?: number | null;
  /** When true, base service price is the minimum shown before option selection. */
  priceOptionsEnabled?: boolean;
}

interface ServiceCardProps {
  service: Service;

  onEdit?: (_service: Service) => void;

  onDelete?: (_serviceId: string) => void;
  isEditable?: boolean;
  isPublic?: boolean;
  businessSlug?: string;
  /**
   * Appends `for=owner` to the book/details link so the rest of the flow
   * knows the business owner is booking on a customer's behalf.
   */
  manualBookingForCustomer?: boolean;
  /** When set, forwarded to `/book/details` as `?lang=` (booking funnel only). */
  bookingFlowLocale?: PublicBookingFlowLocale;
}

export const ServiceCard: React.FC<ServiceCardProps> = ({
  service,
  onEdit,
  onDelete,
  isEditable = false,
  isPublic = false,
  businessSlug = '',
  manualBookingForCustomer = false,
  bookingFlowLocale = 'en',
}) => {
  const ui = publicBookingUi(bookingFlowLocale);
  const [isDescriptionExpanded, setIsDescriptionExpanded] = useState(false);
  const description = service.description || '';
  const isLongDescription = serviceDescriptionNeedsSeeMore(description);

  const effectiveDurationMinutes =
    service.duration_minutes != null && service.duration_minutes > 0
      ? service.duration_minutes
      : service.hours_to_complete != null && service.hours_to_complete > 0
        ? Math.round(service.hours_to_complete * 60)
        : null;

  const formatPrice = (price: string | number) => {
    // If it's already a formatted string (starts with $), return as is
    if (typeof price === 'string' && price.startsWith('$')) {
      return price;
    }

    // If it's a number (price in cents), convert to dollars
    if (typeof price === 'number') {
      if (price === 0) return ui.serviceCard.contactForQuote;
      return `$${(price / 100).toFixed(0)}`;
    }

    // If it's a string without $, try to parse it
    if (typeof price === 'string') {
      if (!price || price === '0' || price === '$0')
        return ui.serviceCard.contactForQuote;
      const numericPrice = price.replace(/[^0-9]/g, '');
      return numericPrice ? `$${numericPrice}` : ui.serviceCard.contactForQuote;
    }

    return ui.serviceCard.contactForQuote;
  };

  const showStartingAt =
    service.priceOptionsEnabled === true &&
    typeof service.price === 'number' &&
    service.price > 0;

  return (
    <GlassCard
      blurColor="bg-zinc-500"
      rounded="rounded-2xl"
      className="group"
      padding="md"
    >
      {/* Header: mobile ~16px title / ~18px price; sm+ matches denser “poster” scale */}
      <div className="flex justify-between items-start gap-2 mb-2.5 sm:gap-3 sm:mb-3">
        <h3 className="text-base font-bold text-white tracking-tight flex-1 min-w-0 pr-1 sm:pr-2 sm:text-lg sm:font-black">
          {service.name}
        </h3>
        <span className="text-right leading-none flex-shrink-0">
          {showStartingAt ? (
            <span className="block text-xs font-medium text-zinc-400 mb-0.5 leading-none sm:mb-1 sm:text-[11px]">
              {ui.serviceCard.startingAt}
            </span>
          ) : null}
          <span className="text-lg font-bold text-white leading-none tabular-nums sm:text-xl sm:font-black">
            {formatPrice(service.price)}
          </span>
        </span>
      </div>

      <div className="border-t border-white/[0.04] mb-3 sm:mb-4" />

      {/* Description — fixed min-height so all cards align; long text is collapsible */}
      <div className="mb-0 min-h-[4rem] sm:min-h-[4.5rem]">
        <p
          className={`text-zinc-400 text-[15px] leading-relaxed whitespace-pre-line break-words sm:text-sm ${
            isLongDescription && !isDescriptionExpanded ? 'line-clamp-5' : ''
          }`}
        >
          {description}
        </p>
        {isLongDescription && (
          <button
            type="button"
            onClick={() => setIsDescriptionExpanded(prev => !prev)}
            className="mt-1.5 text-xs font-medium text-zinc-400 hover:text-zinc-300 active:text-zinc-300 transition-colors cursor-pointer touch-manipulation min-h-[44px] min-w-[44px] -ml-2 pl-2 flex items-center gap-1"
            aria-expanded={isDescriptionExpanded}
          >
            {isDescriptionExpanded ? (
              <>
                <ChevronUpIcon className="h-3.5 w-3.5" />
                {ui.serviceCard.seeLess}
              </>
            ) : (
              <>
                <ChevronDownIcon className="h-3.5 w-3.5" />
                {ui.serviceCard.seeMore}
              </>
            )}
          </button>
        )}
      </div>

      {/* Faint divider + footer: duration left, Book Now right */}
      <div className="flex items-center justify-between pt-2.5 sm:pt-3">
        {effectiveDurationMinutes ? (
          <div className="flex items-center gap-1.5 text-zinc-500">
            <ClockIcon className="h-3.5 w-3.5 flex-shrink-0 sm:h-3 sm:w-3" />
            <span className="text-[13px] font-medium sm:text-xs">
              {formatDurationMinutes(
                effectiveDurationMinutes,
                bookingFlowLocale
              )}
            </span>
          </div>
        ) : (
          <div />
        )}

        {isPublic && !isEditable && businessSlug && service.id && (
          <Link
            href={getBusinessBookDetailsPath(businessSlug, service.id, {
              forOwner: manualBookingForCustomer,
              lang: bookingFlowLocale,
            })}
            className="inline-flex items-center gap-1 text-white text-[15px] font-semibold hover:text-zinc-200 transition-colors cursor-pointer sm:text-sm"
          >
            {ui.common.select}
            <ChevronRightIcon className="h-3.5 w-3.5" />
          </Link>
        )}
      </div>

      {/* Edit controls */}
      {isEditable && (
        <div className="px-5 pb-5 pt-4 flex gap-2 border-t border-white/10 mt-4">
          {onEdit && (
            <Button
              onClick={() => onEdit(service)}
              variant="primary"
              className="flex-1 hover:scale-105"
            >
              Edit Service
            </Button>
          )}
          {onDelete && service.id && (
            <Button
              onClick={() => onDelete(service.id!)}
              variant="danger"
              className="flex-1 hover:scale-105"
            >
              Delete
            </Button>
          )}
        </div>
      )}
    </GlassCard>
  );
};
