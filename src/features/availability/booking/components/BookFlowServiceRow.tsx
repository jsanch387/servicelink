'use client';

import {
  serviceListingPriceClassName,
  serviceListingStartingAtClassName,
} from '@/components/shared/serviceListingTypography';
import type { PublicBookingFlowLocale } from '@/constants/routes';
import { getBusinessBookDetailsPath } from '@/constants/routes';
import { formatDurationMinutes } from '@/features/availability/booking/utils/formatDuration';
import { publicBookingUi } from '@/libs/i18n/publicBookingUi';
import { CheckIcon } from '@heroicons/react/24/solid';
import { useRouter } from 'next/navigation';
import { useId, useState } from 'react';

export interface BookFlowServiceRowProps {
  service: {
    id: string;
    name: string;
    priceCents: number;
    priceOptionsEnabled: boolean;
    hours_to_complete: number | null;
    duration_minutes: number | null;
    description?: string | null;
  };
  businessSlug: string;
  manualBookingForCustomer?: boolean;
  bookingFlowLocale?: PublicBookingFlowLocale;
  isSelected?: boolean;
  onSelect?: () => void;
  /** When false, selection is controlled by the parent and does not navigate immediately. */
  navigateOnSelect?: boolean;
  /** Append this service to the current public multi-job visit. */
  addJob?: boolean;
}

function formatPrice(cents: number, contactLabel: string): string {
  if (cents === 0) return contactLabel;
  return `$${(cents / 100).toFixed(0)}`;
}

/**
 * Full-width service row for the book flow picker — matches PriceOptionSelector layout.
 * Description stays collapsible so the list stays scannable.
 */
export function BookFlowServiceRow({
  service,
  businessSlug,
  manualBookingForCustomer = false,
  bookingFlowLocale = 'en',
  isSelected = false,
  onSelect,
  navigateOnSelect = true,
  addJob = false,
}: BookFlowServiceRowProps) {
  const router = useRouter();
  const ui = publicBookingUi(bookingFlowLocale);
  const descriptionId = useId();
  const [descriptionExpanded, setDescriptionExpanded] = useState(false);

  const description = service.description?.trim() ?? '';
  const hasDescription = description.length > 0;

  const effectiveDurationMinutes =
    service.duration_minutes != null && service.duration_minutes > 0
      ? service.duration_minutes
      : service.hours_to_complete != null && service.hours_to_complete > 0
        ? Math.round(service.hours_to_complete * 60)
        : null;

  const durationLine = effectiveDurationMinutes
    ? formatDurationMinutes(effectiveDurationMinutes, bookingFlowLocale)
    : null;

  const showStartingAt = service.priceOptionsEnabled && service.priceCents > 0;

  const href = getBusinessBookDetailsPath(businessSlug, service.id, {
    forOwner: manualBookingForCustomer,
    lang: bookingFlowLocale,
    addJob,
  });

  const handleSelect = () => {
    onSelect?.();
    if (navigateOnSelect) router.push(href);
  };

  return (
    <div
      className={`rounded-xl border transition-colors ${
        isSelected
          ? 'border-white/30 bg-white/10 text-white'
          : 'border-white/10 bg-white/[0.04] text-zinc-300'
      }`}
    >
      <button
        type="button"
        onClick={handleSelect}
        className={`flex w-full min-h-[52px] cursor-pointer touch-manipulation items-center justify-between gap-3 p-4 text-left transition-colors ${
          isSelected ? '' : 'hover:bg-white/[0.03]'
        }`}
        aria-pressed={isSelected}
      >
        <span
          className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full border ${
            isSelected
              ? 'border-white/40 bg-white/20'
              : 'border-white/20 bg-transparent'
          }`}
          aria-hidden
        >
          {isSelected ? <CheckIcon className="h-3.5 w-3.5 text-white" /> : null}
        </span>
        <span className="min-w-0 flex-1">
          <span className="block font-semibold text-white">{service.name}</span>
          {durationLine ? (
            <span className="mt-0.5 block text-xs font-normal text-zinc-500">
              {durationLine}
            </span>
          ) : null}
        </span>
        <span className="shrink-0 text-right leading-none">
          {showStartingAt ? (
            <span className={serviceListingStartingAtClassName}>
              {ui.serviceCard.startingAt}
            </span>
          ) : null}
          <span className={serviceListingPriceClassName}>
            {formatPrice(service.priceCents, ui.serviceCard.contactForQuote)}
          </span>
        </span>
      </button>

      {hasDescription ? (
        <div className="border-t border-white/[0.06] px-4 pb-3 pt-2">
          <button
            type="button"
            onClick={() => setDescriptionExpanded(prev => !prev)}
            className="cursor-pointer touch-manipulation text-xs font-medium text-zinc-400 underline underline-offset-2 transition-colors hover:text-white"
            aria-expanded={descriptionExpanded}
            aria-controls={descriptionId}
          >
            {descriptionExpanded
              ? ui.bookPicker.hideDescription
              : ui.bookPicker.seeDescription}
          </button>
          {descriptionExpanded ? (
            <p
              id={descriptionId}
              className="mt-2 text-xs leading-relaxed text-zinc-400 whitespace-pre-line [overflow-wrap:anywhere]"
            >
              {description}
            </p>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
