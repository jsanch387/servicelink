'use client';

import { Button, CrownIcon } from '@/components/shared';
import { ROUTES } from '@/constants/routes';
import { ProFeatureLabel } from '@/features/dashboard';
import React from 'react';

/** Free-tier CTA: quote requests on the booking link are a Pro feature. */
export const QuotesAcceptRequestsUpgradeCta: React.FC = () => {
  return (
    <div className="rounded-2xl border border-amber-400/20 bg-gradient-to-br from-amber-500/[0.12] via-white/[0.03] to-transparent px-4 py-4 shadow-[inset_0_1px_0_0_rgba(255,255,255,0.06)] sm:px-5 sm:py-5">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between sm:gap-6">
        <div className="flex min-w-0 items-start gap-3">
          <span className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-amber-500/15 ring-1 ring-inset ring-amber-400/25">
            <CrownIcon className="h-5 w-5 text-amber-300" aria-hidden />
          </span>
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="text-sm font-semibold tracking-tight text-white sm:text-base">
                Upgrade to accept quotes on your booking link
              </h2>
              <ProFeatureLabel />
            </div>
            <p className="mt-1.5 text-sm leading-relaxed text-zinc-400">
              Customers tap <span className="text-zinc-200">Request quote</span>{' '}
              when they want a price first. It shows up in Requested — you send
              the quote from here.
            </p>
          </div>
        </div>
        <Button
          href={ROUTES.DASHBOARD.UPGRADE}
          variant="inverse"
          size="sm"
          icon={<CrownIcon className="h-4 w-4 text-black" aria-hidden />}
          className="w-full shrink-0 whitespace-nowrap sm:w-auto"
        >
          Upgrade to Pro
        </Button>
      </div>
    </div>
  );
};
