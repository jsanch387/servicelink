import React from 'react';
import type { ProFeatureItem } from '../types';
import { PricingPlanFeatureList } from './PricingPlanFeatureList';

export type PricingPlanCardVariant = 'free' | 'pro';

export interface PricingPlanCardProps {
  variant: PricingPlanCardVariant;
  title: string;
  description: string;
  /** e.g. "$0", "$10" */
  price: string;
  priceSuffix?: string;
  features: readonly ProFeatureItem[];
  emphasizeFeatureHighlights?: boolean;
  /** e.g. "Most popular" — only typical for Pro */
  badgeLabel?: string;
  /** Primary actions row (buttons) at the bottom of the card */
  footer: React.ReactNode;
  className?: string;
}

const shellByVariant: Record<
  PricingPlanCardVariant,
  { outer: string; accent: string }
> = {
  free: {
    outer:
      'relative overflow-hidden rounded-2xl border border-white/[0.07] bg-zinc-950/40 p-6 shadow-[0_1px_0_0_rgba(255,255,255,0.04)_inset,0_20px_50px_-24px_rgba(0,0,0,0.65)] backdrop-blur-xl sm:rounded-[1.35rem] sm:p-8',
    accent:
      'pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/[0.12] to-transparent',
  },
  pro: {
    outer:
      'relative overflow-hidden rounded-2xl border border-white/[0.1] bg-gradient-to-b from-white/[0.06] via-zinc-950/50 to-zinc-950/80 p-6 shadow-[0_1px_0_0_rgba(255,255,255,0.06)_inset,0_28px_64px_-28px_rgba(0,0,0,0.75)] backdrop-blur-xl sm:rounded-[1.35rem] sm:p-8',
    accent:
      'pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/25 to-transparent',
  },
};

/**
 * Marketing / dashboard plan column: title, blurb, price, checklist, footer CTA.
 * Used on `/pricing` and `/dashboard/upgrade`.
 */
export const PricingPlanCard: React.FC<PricingPlanCardProps> = ({
  variant,
  title,
  description,
  price,
  priceSuffix = '/ month',
  features,
  emphasizeFeatureHighlights = true,
  badgeLabel,
  footer,
  className = '',
}) => {
  const shell = shellByVariant[variant];
  return (
    <div
      className={`${shell.outer} flex flex-col text-left ${className}`.trim()}
    >
      <div className={shell.accent} aria-hidden />
      {variant === 'pro' ? (
        <>
          <div
            className="pointer-events-none absolute inset-0 rounded-2xl ring-1 ring-inset ring-white/[0.04] sm:rounded-[1.35rem]"
            aria-hidden
          />
          {badgeLabel ? (
            <div className="pointer-events-none absolute right-4 top-4 rounded-full bg-white px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wider text-zinc-900 sm:right-5 sm:top-5 sm:text-[11px]">
              {badgeLabel}
            </div>
          ) : null}
        </>
      ) : (
        <div
          className="pointer-events-none absolute inset-0 rounded-2xl ring-1 ring-inset ring-white/[0.03] sm:rounded-[1.35rem]"
          aria-hidden
        />
      )}
      <div className="relative z-[1] flex min-h-0 flex-1 flex-col text-left">
        <div className="mb-8 text-left">
          <h2 className="logo-text text-2xl font-semibold tracking-tight text-white sm:text-[1.65rem]">
            {title}
          </h2>
          <p className="mt-2 max-w-md text-left text-sm leading-relaxed text-zinc-500 sm:text-[0.9375rem]">
            {description}
          </p>
        </div>

        <div className="mb-8 flex flex-wrap items-baseline justify-start gap-x-1.5 gap-y-1 border-b border-white/[0.06] pb-8 text-left">
          <span className="logo-text text-[2.65rem] font-semibold leading-none tracking-tight text-white tabular-nums sm:text-5xl">
            {price}
          </span>
          <span className="text-sm font-medium text-zinc-500 sm:text-base">
            {priceSuffix}
          </span>
        </div>

        <PricingPlanFeatureList
          items={features}
          emphasizeHighlights={emphasizeFeatureHighlights}
        />

        <div className="min-h-10 flex-1" aria-hidden />
        <div className="border-t border-white/[0.06] pt-8">{footer}</div>
      </div>
    </div>
  );
};
