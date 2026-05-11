import { CheckIcon } from '@heroicons/react/20/solid';
import React from 'react';
import type { ProFeatureItem } from '../types';

function PricingPlanFeatureBullet() {
  return (
    <span
      className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-white/[0.06] ring-1 ring-white/[0.06]"
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
}

export const PricingPlanFeatureList: React.FC<PricingPlanFeatureListProps> = ({
  items,
  emphasizeHighlights = true,
}) => (
  <ul className="space-y-3 text-left">
    {items.map((item, i) => (
      <li
        key={`${item.text}-${i}`}
        className="flex items-start gap-3 text-sm leading-relaxed text-zinc-400 sm:text-[0.9375rem]"
      >
        <PricingPlanFeatureBullet />
        <span
          className={
            emphasizeHighlights && item.highlight
              ? 'font-medium text-zinc-100'
              : ''
          }
        >
          {item.text}
        </span>
      </li>
    ))}
  </ul>
);
