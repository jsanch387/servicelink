'use client';

import { CrownIcon } from '@/components/shared';
import React from 'react';

/** Small “Pro” pill with crown — matches services pricing options styling. */
export const ProFeatureLabel: React.FC<{ className?: string }> = ({
  className = '',
}) => (
  <span
    className={`inline-flex shrink-0 items-center gap-1 text-xs font-semibold tracking-wide text-amber-300${className ? ` ${className}` : ''}`}
  >
    <CrownIcon className="h-3 w-3 shrink-0" aria-hidden />
    Pro
  </span>
);
