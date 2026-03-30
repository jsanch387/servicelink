'use client';

import { Button, GlassCard } from '@/components/shared';
import { getBusinessBookDetailsPath } from '@/constants/routes';
import { formatDurationMinutes } from '@/features/availability/booking/utils/formatDuration';
import {
  ChevronDownIcon,
  ChevronRightIcon,
  ChevronUpIcon,
  ClockIcon,
} from '@heroicons/react/24/outline';
import Link from 'next/link';
import React, { useEffect, useState } from 'react';

/** Mobile-first truncation; browser gets a longer preview before "See more". */
const MOBILE_DESCRIPTION_PREVIEW_LENGTH = 120;
const DESKTOP_DESCRIPTION_PREVIEW_LENGTH = 220;

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
}

export const ServiceCard: React.FC<ServiceCardProps> = ({
  service,
  onEdit,
  onDelete,
  isEditable = false,
  isPublic = false,
  businessSlug = '',
  manualBookingForCustomer = false,
}) => {
  const [isDescriptionExpanded, setIsDescriptionExpanded] = useState(false);
  const [isDesktop, setIsDesktop] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia('(min-width: 640px)');
    const apply = () => setIsDesktop(mq.matches);
    apply();
    mq.addEventListener('change', apply);
    return () => mq.removeEventListener('change', apply);
  }, []);

  const description = service.description || '';
  const previewLength = isDesktop
    ? DESKTOP_DESCRIPTION_PREVIEW_LENGTH
    : MOBILE_DESCRIPTION_PREVIEW_LENGTH;
  const isLongDescription = description.length > previewLength;
  const previewText =
    isLongDescription && !isDescriptionExpanded
      ? `${description.slice(0, previewLength).trim()}...`
      : description;

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
      if (price === 0) return 'Contact for quote';
      return `$${(price / 100).toFixed(0)}`;
    }

    // If it's a string without $, try to parse it
    if (typeof price === 'string') {
      if (!price || price === '0' || price === '$0') return 'Contact for quote';
      const numericPrice = price.replace(/[^0-9]/g, '');
      return numericPrice ? `$${numericPrice}` : 'Contact for quote';
    }

    return 'Contact for quote';
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
      {/* Header: service name + price (thick black weight) */}
      <div className="flex justify-between items-start mb-3">
        <h3 className="text-lg font-black text-white tracking-tight pr-4 flex-1">
          {service.name}
        </h3>
        <span className="text-right leading-none flex-shrink-0">
          {showStartingAt ? (
            <span className="block text-[11px] font-medium text-zinc-400 mb-1 leading-none">
              Starting at
            </span>
          ) : null}
          <span className="text-xl font-black text-white leading-none">
            {formatPrice(service.price)}
          </span>
        </span>
      </div>

      <div className="border-t border-white/[0.04] mb-4" />

      {/* Description — fixed min-height so all cards align; long text is collapsible */}
      <div className="mb-0 min-h-[4.5rem]">
        <p
          className={`text-zinc-400 text-sm leading-relaxed ${
            isLongDescription && !isDescriptionExpanded ? 'line-clamp-3' : ''
          }`}
        >
          {previewText}
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
                See less
              </>
            ) : (
              <>
                <ChevronDownIcon className="h-3.5 w-3.5" />
                See more
              </>
            )}
          </button>
        )}
      </div>

      {/* Faint divider + footer: duration left, Book Now right */}
      <div className="flex items-center justify-between pt-3">
        {effectiveDurationMinutes ? (
          <div className="flex items-center gap-1.5 text-zinc-500">
            <ClockIcon className="h-3 w-3 flex-shrink-0" />
            <span className="text-xs font-medium">
              {formatDurationMinutes(effectiveDurationMinutes)}
            </span>
          </div>
        ) : (
          <div />
        )}

        {isPublic && !isEditable && businessSlug && service.id && (
          <Link
            href={getBusinessBookDetailsPath(businessSlug, service.id, {
              forOwner: manualBookingForCustomer,
            })}
            className="inline-flex items-center gap-1 text-white text-sm font-semibold hover:text-zinc-200 transition-colors cursor-pointer"
          >
            Select
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
