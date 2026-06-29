import { CheckIcon } from '@heroicons/react/20/solid';
import React from 'react';
import type { ProFeatureItem } from '../types';

function PricingPlanFeatureBullet({
  variant = 'default',
}: {
  variant?: 'default' | 'neutral';
}) {
  if (variant === 'neutral') {
    return (
      <span
        className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-white/[0.08] ring-1 ring-white/10"
        aria-hidden
      >
        <CheckIcon className="h-3 w-3 text-white/80" />
      </span>
    );
  }

  return (
    <span
      className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-emerald-500/10 ring-1 ring-emerald-500/20"
      aria-hidden
    >
      <CheckIcon className="h-3 w-3 text-emerald-400/90" />
    </span>
  );
}

export interface PricingPlanFeatureListProps {
  items: readonly ProFeatureItem[];
  /** When false, highlight rows use the same body weight as other lines (e.g. Free tier). */
  emphasizeHighlights?: boolean;
  /** neutral = white checkmarks (Free card); default = emerald (Pro card). */
  bulletVariant?: 'default' | 'neutral';
}

export const PricingPlanFeatureList: React.FC<PricingPlanFeatureListProps> = ({
  items,
  emphasizeHighlights = true,
  bulletVariant = 'default',
}) => (
  <ul className="space-y-3 text-left">
    {items.map((item, i) => (
      <li
        key={`${item.text}-${i}`}
        className="flex items-start gap-3 text-sm leading-relaxed text-zinc-400 sm:text-[0.9375rem]"
      >
        <PricingPlanFeatureBullet variant={bulletVariant} />
        <span
          className={
            emphasizeHighlights && item.highlight
              ? bulletVariant === 'default'
                ? 'font-semibold text-white'
                : 'font-medium text-zinc-200'
              : ''
          }
        >
          {item.text}
        </span>
      </li>
    ))}
  </ul>
);
