'use client';

import { ArrowLeftIcon, ChevronLeftIcon } from '@heroicons/react/24/outline';

type ResponsiveBackNavIconProps = {
  className?: string;
};

/**
 * Public booking / funnel headers: on narrow viewports use a chevron (common mobile pattern);
 * from `sm` up keep the fuller arrow-left affordance.
 */
export function ResponsiveBackNavIcon({
  className = 'h-5 w-5',
}: ResponsiveBackNavIconProps) {
  return (
    <>
      <ChevronLeftIcon
        className={`${className} shrink-0 sm:hidden`}
        aria-hidden
      />
      <ArrowLeftIcon
        className={`hidden shrink-0 sm:block ${className}`}
        aria-hidden
      />
    </>
  );
}
