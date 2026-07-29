'use client';

import {
  PublicFlowBackChevron,
  publicFlowBackNavClassName,
} from '@/components/shared/publicFlowBackNav';
import { ROUTES } from '@/constants/routes';
import Link from 'next/link';
import React from 'react';

export interface CreateAppointmentHeaderProps {
  title?: string;
  subtitle?: string;
}

/**
 * Back chevron sits at the left of the dashboard content pane (far left on desktop).
 * Title stays in the centered wizard column.
 */
export function CreateAppointmentHeader({
  title,
  subtitle,
}: CreateAppointmentHeaderProps) {
  return (
    <header className="mb-6 sm:mb-8">
      <div className="mb-6 px-4 sm:px-6 lg:px-8">
        <Link
          href={ROUTES.DASHBOARD.BOOKINGS}
          className={`${publicFlowBackNavClassName} -ml-1.5 min-h-10`}
          aria-label="Back to Bookings"
        >
          <PublicFlowBackChevron />
          <span>Back</span>
        </Link>
      </div>

      {(title || subtitle) && (
        <div className="mx-auto w-full max-w-xl px-4">
          {title ? (
            <h1 className="text-xl font-black tracking-tight text-white sm:text-2xl">
              {title}
            </h1>
          ) : null}
          {subtitle ? (
            <p className="mt-0.5 max-w-xl text-sm text-zinc-500">{subtitle}</p>
          ) : null}
          <div className="mt-4 h-px w-full bg-white/10" aria-hidden />
        </div>
      )}
    </header>
  );
}
