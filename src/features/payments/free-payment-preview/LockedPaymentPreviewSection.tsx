'use client';

import { LockClosedIcon } from '@heroicons/react/24/outline';
import React from 'react';
import {
  FREE_PREVIEW_DIMMED_CONTENT_CLASSES,
  FREE_PREVIEW_SCRIM_CLASSES,
} from './previewLayerClasses';

export interface LockedPaymentPreviewSectionProps {
  children: React.ReactNode;
  className?: string;
  /** Accessible name for the locked preview region */
  lockedLabel: string;
}

/**
 * Dimmed, non-interactive block with a lock affordance — used only in free-tier previews.
 */
export const LockedPaymentPreviewSection: React.FC<
  LockedPaymentPreviewSectionProps
> = ({ children, className, lockedLabel }) => {
  const rootClass = className ? `relative ${className}` : 'relative';

  return (
    <div className={rootClass} role="group" aria-label={lockedLabel}>
      <div className={FREE_PREVIEW_DIMMED_CONTENT_CLASSES} aria-hidden>
        {children}
      </div>
      <div className={FREE_PREVIEW_SCRIM_CLASSES} aria-hidden />
      <div
        className="pointer-events-none absolute right-3 top-3 z-[1] sm:right-4 sm:top-4"
        aria-hidden
      >
        <LockClosedIcon className="h-5 w-5 text-gray-400" />
      </div>
    </div>
  );
};
