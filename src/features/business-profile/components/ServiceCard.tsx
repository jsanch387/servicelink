'use client';

import { Button, GlassCard } from '@/components/shared';
import {
  serviceListingNameClassName,
  serviceListingPriceClassName,
  serviceListingStartingAtClassName,
} from '@/components/shared/serviceListingTypography';
import type { PublicBookingFlowLocale } from '@/constants/routes';
import { getBusinessBookDetailsPath } from '@/constants/routes';
import { formatDurationMinutes } from '@/features/availability/booking/utils/formatDuration';
import type { PublicActiveSale } from '@/features/marketing/types/publicActiveSale';
import { getServiceSalePriceCents } from '@/features/marketing/utils/getServiceSalePriceCents';
import { publicBookingUi } from '@/libs/i18n/publicBookingUi';
import {
  ChevronRightIcon,
  ClockIcon,
} from '@heroicons/react/24/outline';
import Link from 'next/link';
import React, { useMemo, useState } from 'react';
import { ServiceDescriptionFormatted } from './ServiceDescriptionFormatted';
import { useIsDesktopViewport } from '../hooks/useIsDesktopViewport';
import {
  serviceCardDescriptionCollapsedMaxChars,
  serviceCardDescriptionNeedsExpand,
  truncateServiceDescriptionForCardPreview,
} from '../utils/serviceDescriptionDisplay';

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
  /** Hide long description (owner manual booking — they already know their services). */
  hideDescription?: boolean;
  /**
   * When set, forwarded to `/book/details` as `?lang=` (booking funnel only).
   * When true on a public card, do not show the booking “Select” link.
   */
  hideBookLink?: boolean;
  bookingFlowLocale?: PublicBookingFlowLocale;
  /** When set on public cards, show struck-through base price + sale price. */
  publicActiveSale?: PublicActiveSale | null;
}

export const ServiceCard: React.FC<ServiceCardProps> = ({
  service,
  onEdit,
  onDelete,
  isEditable = false,
  isPublic = false,
  businessSlug = '',
  manualBookingForCustomer = false,
  hideDescription = false,
  hideBookLink = false,
  bookingFlowLocale = 'en',
  publicActiveSale = null,
}) => {
  const ui = publicBookingUi(bookingFlowLocale);
  const [isDescriptionExpanded, setIsDescriptionExpanded] = useState(false);
  const description = service.description || '';
  const isDesktop = useIsDesktopViewport();
  const collapsedMaxChars = serviceCardDescriptionCollapsedMaxChars(isDesktop);
  const descriptionNeedsExpand = serviceCardDescriptionNeedsExpand(
    description,
    collapsedMaxChars
  );
  const collapsedDescriptionPreview = useMemo(
    () =>
      truncateServiceDescriptionForCardPreview(description, collapsedMaxChars),
    [description, collapsedMaxChars]
  );

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

  const salePrice =
    publicActiveSale && typeof service.price === 'number'
      ? getServiceSalePriceCents(service.price, publicActiveSale)
      : null;

  const renderPrice = (price: string | number) => (
    <span className={serviceListingPriceClassName}>{formatPrice(price)}</span>
  );

  return (
    <GlassCard
      blurColor="bg-zinc-500"
      rounded="rounded-2xl"
      className={
        salePrice
          ? 'group border-white/14 ring-1 ring-inset ring-white/[0.07]'
          : 'group'
      }
      padding="md"
    >
      <div
        className={`mb-2.5 flex justify-between gap-2 sm:mb-3 sm:gap-3 ${
          showStartingAt ? 'items-start' : 'items-baseline'
        }`}
      >
        <h3
          className={`${serviceListingNameClassName} min-w-0 flex-1 pr-1 sm:pr-2`}
        >
          {service.name}
        </h3>
        <div className="shrink-0 text-right leading-none">
          {showStartingAt ? (
            <span className={serviceListingStartingAtClassName}>
              {ui.serviceCard.startingAt}
            </span>
          ) : null}
          {salePrice ? (
            <div className="flex items-baseline justify-end gap-2 whitespace-nowrap">
              <span className="text-sm font-medium text-zinc-500 line-through decoration-zinc-500/70 tabular-nums">
                {formatPrice(salePrice.originalCents)}
              </span>
              <span className={serviceListingPriceClassName}>
                {formatPrice(salePrice.saleCents)}
              </span>
            </div>
          ) : (
            renderPrice(service.price)
          )}
        </div>
      </div>

      {!hideDescription ? (
        <div className="border-t border-white/[0.04] mb-3 sm:mb-4" />
      ) : null}

      {!hideDescription ? (
        <div className="mb-0">
          {descriptionNeedsExpand && !isDescriptionExpanded ? (
            <p className="m-0 leading-relaxed break-words text-zinc-400 text-[15px] sm:text-sm">
              {collapsedDescriptionPreview}
              {'... '}
              <button
                type="button"
                onClick={() => setIsDescriptionExpanded(true)}
                className="inline font-medium text-white hover:text-zinc-200 active:text-zinc-200 transition-colors cursor-pointer touch-manipulation"
                aria-expanded={false}
              >
                {ui.serviceCard.seeMore}
              </button>
            </p>
          ) : (
            <div>
              <div className="text-zinc-400 text-[15px] sm:text-sm">
                <ServiceDescriptionFormatted description={description} />
              </div>
              {descriptionNeedsExpand && isDescriptionExpanded ? (
                <button
                  type="button"
                  onClick={() => setIsDescriptionExpanded(false)}
                  className="mt-2 inline-flex text-sm font-medium text-white hover:text-zinc-200 active:text-zinc-200 transition-colors cursor-pointer touch-manipulation"
                  aria-expanded
                >
                  {ui.serviceCard.seeLess}
                </button>
              ) : null}
            </div>
          )}
        </div>
      ) : null}

      {/* Footer: duration left, Select right */}
      <div className="mt-4 flex items-center justify-between sm:mt-5">
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

        {isPublic &&
          !hideBookLink &&
          !isEditable &&
          businessSlug &&
          service.id && (
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
