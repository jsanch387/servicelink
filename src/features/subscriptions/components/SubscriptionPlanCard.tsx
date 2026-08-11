'use client';

import { Button, FilterPills, GlassCard } from '@/components/shared';
import type { PublicBookingFlowLocale } from '@/constants/routes';
import { useServiceDescriptionClamp } from '@/features/business-profile/hooks/useServiceDescriptionClamp';
import { SERVICE_CARD_DESCRIPTION_CLAMP_CLASS } from '@/features/business-profile/utils/serviceDescriptionDisplay';
import { publicBookingUi } from '@/libs/i18n/publicBookingUi';
import React, { useMemo, useState } from 'react';
import type { CustomerSubscriptionPlan } from '../types/customerSubscriptionPlan';
import {
  formatCadenceOptionLabel,
  formatCadencePriceSuffix,
  formatSubscriptionPriceCents,
  getDefaultCadenceOption,
} from '../utils/formatSubscriptionPrice';
import { joinDescriptionAndBenefits } from '../utils/planDescription';

interface SubscriptionPlanCardProps {
  plan: CustomerSubscriptionPlan;
  bookingFlowLocale?: PublicBookingFlowLocale;
  /** Pure UI for now — wire to enroll/checkout later. */
  onSubscribe?: (planId: string, cadenceOptionId: string) => void;
  /** Owner preview (e.g. plan-ready screen) — hide subscribe CTA. */
  preview?: boolean;
}

export const SubscriptionPlanCard: React.FC<SubscriptionPlanCardProps> = ({
  plan,
  bookingFlowLocale = 'en',
  onSubscribe,
  preview = false,
}) => {
  const ui = publicBookingUi(bookingFlowLocale);
  const defaultOption = getDefaultCadenceOption(plan.cadenceOptions);
  const [selectedCadenceId, setSelectedCadenceId] = useState(
    defaultOption?.id ?? ''
  );
  const [isDescriptionExpanded, setIsDescriptionExpanded] = useState(false);

  const description = joinDescriptionAndBenefits(
    plan.description,
    plan.benefits
  );
  const { ref: descriptionClampRef, isTruncatable } =
    useServiceDescriptionClamp(description, isDescriptionExpanded);
  const showDescriptionToggle = isTruncatable || isDescriptionExpanded;

  const selectedOption = useMemo(
    () =>
      plan.cadenceOptions.find(option => option.id === selectedCadenceId) ??
      defaultOption,
    [plan.cadenceOptions, selectedCadenceId, defaultOption]
  );

  const showCadencePicker = plan.cadenceOptions.length > 1;

  const cadencePillOptions = useMemo(
    () =>
      plan.cadenceOptions.map(option => ({
        id: option.id,
        label: formatCadenceOptionLabel(option, bookingFlowLocale),
      })),
    [plan.cadenceOptions, bookingFlowLocale]
  );

  const price = selectedOption
    ? formatSubscriptionPriceCents(selectedOption.priceCents, bookingFlowLocale)
    : ui.subscriptions.contactForPrice;
  const priceSuffix = selectedOption
    ? formatCadencePriceSuffix(selectedOption, bookingFlowLocale)
    : '';

  return (
    <GlassCard
      blurColor="bg-zinc-500"
      rounded="rounded-2xl"
      padding="none"
      className={
        plan.isPopular
          ? 'border-white/20 bg-white/[0.045] transition-colors duration-200 hover:border-white/28 hover:bg-white/[0.055]'
          : 'transition-colors duration-200 hover:border-white/14 hover:bg-white/[0.045]'
      }
    >
      <div className="flex h-full flex-col p-5 sm:p-6">
        <div
          className={`flex items-start justify-between gap-3 ${
            showCadencePicker
              ? 'mb-1.5'
              : description.trim() || plan.isPopular
                ? 'mb-4'
                : preview
                  ? ''
                  : 'mb-5'
          }`}
        >
          <div className="min-w-0 flex-1 pr-1">
            <h3 className="m-0 text-base font-semibold tracking-tight break-words text-white sm:text-lg">
              {plan.name}
            </h3>
            {plan.isPopular ? (
              <span className="mt-1.5 inline-flex rounded-md border border-white/10 bg-white/[0.06] px-2 py-0.5 text-[11px] font-medium text-zinc-300">
                {ui.subscriptions.popularBadge}
              </span>
            ) : null}
          </div>
          <div className="flex shrink-0 items-baseline gap-1 tabular-nums">
            <span className="text-2xl font-semibold tracking-tight text-white sm:text-[1.75rem]">
              {price}
            </span>
            {priceSuffix ? (
              <span className="text-sm font-medium text-zinc-500">
                {priceSuffix}
              </span>
            ) : null}
          </div>
        </div>

        {showCadencePicker ? (
          <div className={description.trim() || !preview ? 'mb-4' : ''}>
            <p className="mb-2 text-xs font-medium text-zinc-500">
              {ui.subscriptions.cadencePickerLabel}
            </p>
            <FilterPills
              options={cadencePillOptions}
              value={selectedCadenceId}
              onChange={setSelectedCadenceId}
              ariaLabel={ui.subscriptions.cadencePickerAriaLabel}
              compactOnMobile
              size={preview ? 'sm' : 'md'}
            />
          </div>
        ) : null}

        {description.trim() ? (
          <div className={preview ? '' : 'mb-3'}>
            <div
              ref={descriptionClampRef}
              className={`whitespace-pre-wrap text-sm leading-relaxed text-zinc-500 ${
                isDescriptionExpanded
                  ? ''
                  : SERVICE_CARD_DESCRIPTION_CLAMP_CLASS
              }`.trim()}
            >
              {description}
            </div>
            {showDescriptionToggle ? (
              <button
                type="button"
                onClick={() => setIsDescriptionExpanded(prev => !prev)}
                className="mt-2 inline-flex cursor-pointer touch-manipulation text-sm font-medium text-white transition-colors hover:text-zinc-200 active:text-zinc-200"
                aria-expanded={isDescriptionExpanded}
              >
                {isDescriptionExpanded
                  ? ui.serviceCard.seeLess
                  : ui.serviceCard.seeMore}
              </button>
            ) : null}
          </div>
        ) : null}

        {preview ? null : (
          <div className="mt-auto pt-1">
            <Button
              type="button"
              variant={plan.isPopular ? 'inverse' : 'outline'}
              size="sm"
              fullWidth
              disabled={!selectedOption}
              onClick={() => {
                if (!selectedOption) return;
                onSubscribe?.(plan.id, selectedOption.id);
              }}
            >
              {ui.subscriptions.subscribeCta}
            </Button>
          </div>
        )}
      </div>
    </GlassCard>
  );
};
