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
  /** Tighter spacing under the title (e.g. review step). */
  compact?: boolean;
  /** Hide Bookings nav (e.g. while submit is in progress). */
  hideBack?: boolean;
}

/**
 * Back chevron sits at the left of the dashboard content pane (far left on desktop).
 * Title stays in the centered wizard column.
 */
export function CreateAppointmentHeader({
  title,
  subtitle,
  compact = false,
  hideBack = false,
}: CreateAppointmentHeaderProps) {
  const showNav = !hideBack;
  const showTitleBlock = Boolean(title || subtitle);

  return (
    <header className={compact ? 'mb-4 sm:mb-5' : 'mb-6 sm:mb-8'}>
      <div
        className={
          compact ? 'mb-4 px-4 sm:px-6 lg:px-8' : 'mb-6 px-4 sm:px-6 lg:px-8'
        }
      >
        {showNav ? (
          <Link
            href={ROUTES.DASHBOARD.BOOKINGS}
            className={`${publicFlowBackNavClassName} -ml-1.5 min-h-10`}
            aria-label="Back to Bookings"
          >
            <PublicFlowBackChevron />
            <span>Bookings</span>
          </Link>
        ) : (
          // Keep the same vertical slot as the Bookings control so pending
          // content lines up with success / error.
          <div className="min-h-10" aria-hidden />
        )}
      </div>

      {showTitleBlock ? (
        <div className="mx-auto w-full max-w-xl px-4">
          {title ? (
            <h1 className="text-xl font-black tracking-tight text-white sm:text-2xl">
              {title}
            </h1>
          ) : null}
          {subtitle ? (
            <p className="mt-0.5 max-w-xl text-sm text-zinc-500">{subtitle}</p>
          ) : null}
          <div
            className={`${compact ? 'mt-3' : 'mt-4'} h-px w-full bg-white/10`}
            aria-hidden
          />
        </div>
      ) : null}
    </header>
  );
}
