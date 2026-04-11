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
  { outer: string; glow: string; glowStyle: React.CSSProperties }
> = {
  free: {
    outer:
      'relative rounded-2xl border border-white/15 bg-white/[0.045] backdrop-blur-xl p-6 sm:p-8 flex flex-col h-full overflow-hidden shadow-[0_14px_40px_rgba(0,0,0,0.35)]',
    glow: 'pointer-events-none absolute -top-20 left-1/2 -translate-x-1/2 h-44 w-44 rounded-full blur-3xl',
    glowStyle: { background: 'rgba(255,255,255,0.08)' },
  },
  pro: {
    outer:
      'relative rounded-2xl border border-white/35 bg-white/[0.09] backdrop-blur-xl p-6 sm:p-8 flex flex-col h-full overflow-hidden shadow-[0_18px_52px_rgba(255,255,255,0.08)]',
    glow: 'pointer-events-none absolute -top-24 left-1/2 -translate-x-1/2 h-56 w-56 rounded-full blur-3xl',
    glowStyle: { background: 'rgba(255,255,255,0.16)' },
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
    <div className={`${shell.outer} ${className}`.trim()}>
      <div className={shell.glow} style={shell.glowStyle} aria-hidden />
      {variant === 'pro' ? (
        <>
          <div
            className="pointer-events-none absolute inset-0 rounded-2xl ring-1 ring-white/20"
            aria-hidden
          />
          {badgeLabel ? (
            <div className="pointer-events-none absolute top-0 right-0 bg-white text-zinc-900 text-[10px] sm:text-xs font-semibold uppercase tracking-wider px-3 py-1.5 rounded-bl-xl">
              {badgeLabel}
            </div>
          ) : null}
        </>
      ) : null}
      <div className="relative z-[1] flex min-h-0 flex-1 flex-col">
        <h2 className="logo-text text-xl font-bold text-white mb-2">{title}</h2>
        <p className="text-gray-400 text-sm mb-6 leading-relaxed">
          {description}
        </p>
        <div className="mb-6 pb-6 border-b border-white/10">
          <span className="logo-text text-4xl font-extrabold text-white">
            {price}
          </span>
          <span className="text-gray-400 ml-1 text-sm sm:text-base">
            {priceSuffix}
          </span>
        </div>
        <PricingPlanFeatureList
          items={features}
          emphasizeHighlights={emphasizeFeatureHighlights}
        />
        <div className="min-h-12 flex-1" aria-hidden />
        <div className="pt-6 border-t border-white/10">{footer}</div>
      </div>
    </div>
  );
};
