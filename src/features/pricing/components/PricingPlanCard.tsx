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
  /** e.g. "Most popular" or "Current plan" */
  badgeLabel?: string;
  /** Primary actions row (buttons) at the bottom of the card */
  footer: React.ReactNode;
  className?: string;
}

const variantStyles: Record<
  PricingPlanCardVariant,
  {
    shell: string;
    topBar: string;
    glow: string;
    pricePanel: string;
    priceText: string;
    badge: string;
    bulletVariant: 'default' | 'neutral';
  }
> = {
  free: {
    shell:
      'border-white/10 bg-white/[0.03] shadow-[inset_0_1px_0_0_rgba(255,255,255,0.04)]',
    topBar: 'from-transparent via-white/20 to-transparent',
    glow: '',
    pricePanel: 'border-white/[0.06] bg-white/[0.02]',
    priceText: 'text-white',
    badge: 'border border-white/15 bg-white/[0.06] text-zinc-300',
    bulletVariant: 'default',
  },
  pro: {
    shell:
      'border-white/20 bg-gradient-to-b from-white/[0.08] via-white/[0.03] to-white/[0.02] shadow-[0_0_48px_-16px_rgba(255,255,255,0.12),inset_0_1px_0_0_rgba(255,255,255,0.08)]',
    topBar: 'from-transparent via-white/40 to-transparent',
    glow: 'bg-white/10',
    pricePanel: 'border-white/15 bg-white/[0.05]',
    priceText: 'text-white',
    badge: 'bg-white text-zinc-900 shadow-sm',
    bulletVariant: 'neutral',
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
  const styles = variantStyles[variant];
  const isPro = variant === 'pro';

  return (
    <article
      className={`group relative flex h-full flex-col overflow-hidden rounded-3xl border backdrop-blur-xl transition-colors duration-300 hover:border-white/15 sm:rounded-[1.75rem] ${styles.shell} ${className}`.trim()}
    >
      {isPro ? (
        <div
          className={`pointer-events-none absolute -right-16 -top-16 h-48 w-48 rounded-full blur-[90px] ${styles.glow}`}
          aria-hidden
        />
      ) : null}

      <div
        className={`pointer-events-none absolute inset-x-6 top-0 h-px bg-gradient-to-r sm:inset-x-8 ${styles.topBar}`}
        aria-hidden
      />

      <div className="relative z-[1] flex min-h-0 flex-1 flex-col p-6 sm:p-8">
        <header className="mb-6">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-zinc-500">
                {isPro ? 'Grow your business' : 'Get started'}
              </p>
              <h2 className="logo-text mt-1 text-2xl font-bold tracking-tight text-white sm:text-[1.75rem]">
                {title}
              </h2>
            </div>
            {badgeLabel ? (
              <span
                className={`shrink-0 rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider sm:text-[11px] ${styles.badge}`}
              >
                {badgeLabel}
              </span>
            ) : null}
          </div>
          <p className="mt-3 w-full min-h-[2.75rem] text-sm leading-relaxed text-zinc-500 sm:min-h-[3rem] sm:text-[0.9375rem]">
            {description}
          </p>
        </header>

        <div
          className={`mb-6 rounded-2xl border px-5 py-4 sm:px-6 sm:py-5 ${styles.pricePanel}`}
        >
          <div className="flex flex-wrap items-end gap-x-2 gap-y-1">
            <span
              className={`logo-text text-[2.75rem] font-bold leading-none tracking-tight tabular-nums sm:text-5xl ${styles.priceText}`}
            >
              {price}
            </span>
            <span className="pb-1.5 text-sm font-medium text-zinc-500 sm:text-base">
              {priceSuffix}
            </span>
          </div>
        </div>

        <PricingPlanFeatureList
          items={features}
          emphasizeHighlights={emphasizeFeatureHighlights}
          bulletVariant={styles.bulletVariant}
        />

        <div className="mt-auto min-h-8 flex-1" aria-hidden />

        <div className="mt-6 border-t border-white/[0.06] pt-6 sm:mt-8 sm:pt-8">
          {footer}
        </div>
      </div>
    </article>
  );
};
