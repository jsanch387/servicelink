import { CheckCircleIcon } from '@heroicons/react/24/outline';
import React from 'react';
import type { ProFeatureItem } from '../types';

function PricingPlanFeatureBullet() {
  return (
    <CheckCircleIcon
      className="mt-0.5 h-5 w-5 shrink-0 text-green-500/80"
      strokeWidth={1.75}
      aria-hidden
    />
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
  <ul className="space-y-3.5">
    {items.map((item, i) => (
      <li
        key={`${item.text}-${i}`}
        className="flex items-start gap-3.5 text-gray-300 text-sm sm:text-base"
      >
        <PricingPlanFeatureBullet />
        <span
          className={
            emphasizeHighlights && item.highlight
              ? 'font-semibold text-white'
              : ''
          }
        >
          {item.text}
        </span>
      </li>
    ))}
  </ul>
);
