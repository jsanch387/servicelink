'use client';

import { GlassCard } from '@/components/shared';
import { ROUTES } from '@/constants/routes';
import { ChevronRightIcon } from '@heroicons/react/24/outline';
import Link from 'next/link';
import React from 'react';
import type { OwnerSubscriptionPlan } from '../types/ownerSubscriptionPlan';
import {
  formatCadenceOptionLabel,
  formatCadencePriceSuffix,
  formatSubscriptionPriceCents,
  getDefaultCadenceOption,
} from '../utils/formatSubscriptionPrice';

interface OwnerSubscriptionPlanCardProps {
  plan: OwnerSubscriptionPlan;
  subscriberCount: number;
}

export const OwnerSubscriptionPlanCard: React.FC<
  OwnerSubscriptionPlanCardProps
> = ({ plan, subscriberCount }) => {
  const defaultOption = getDefaultCadenceOption(plan.cadenceOptions);
  const price = defaultOption
    ? formatSubscriptionPriceCents(defaultOption.priceCents)
    : '—';
  const priceSuffix = defaultOption
    ? formatCadencePriceSuffix(defaultOption)
    : '';
  return (
    <GlassCard
      rounded="rounded-2xl"
      padding="none"
      className="!h-auto transition-colors hover:border-white/16"
    >
      <Link
        href={ROUTES.DASHBOARD.SUBSCRIPTIONS_DETAIL(plan.id)}
        className="group flex w-full cursor-pointer flex-col gap-3 p-5 text-left sm:p-6"
      >
        <div className="flex items-start justify-between gap-3">
          <h3 className="m-0 min-w-0 flex-1 pr-1 text-[15px] font-semibold tracking-tight break-words text-white sm:text-base">
            {plan.name}
          </h3>
          <div className="flex shrink-0 items-baseline gap-1 tabular-nums">
            <span className="text-xl font-semibold tracking-tight text-white sm:text-2xl">
              {price}
            </span>
            {priceSuffix ? (
              <span className="text-sm font-medium text-zinc-500">
                {priceSuffix}
              </span>
            ) : null}
          </div>
        </div>

        {plan.cadenceOptions.length > 0 ? (
          <div className="flex flex-wrap gap-1.5">
            {plan.cadenceOptions.map(option => (
              <span
                key={option.id}
                className="rounded-full bg-white/[0.06] px-2.5 py-1 text-xs font-medium text-zinc-400"
              >
                {formatCadenceOptionLabel(option)}
              </span>
            ))}
          </div>
        ) : null}

        <div className="flex items-end justify-between gap-3">
          <p className="m-0 text-sm text-zinc-500">
            {subscriberCount === 0
              ? 'No subscribers yet'
              : subscriberCount === 1
                ? '1 subscriber'
                : `${subscriberCount} subscribers`}
          </p>
          <ChevronRightIcon
            className="h-5 w-5 shrink-0 text-zinc-600 transition-colors group-hover:text-zinc-300"
            aria-hidden
          />
        </div>
      </Link>
    </GlassCard>
  );
};
