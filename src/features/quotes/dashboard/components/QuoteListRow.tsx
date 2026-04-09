'use client';

import { GlassCard } from '@/components/shared';
import { ROUTES } from '@/constants/routes';
import type { DashboardQuote } from '../types';
import {
  formatQuoteCurrency,
  formatQuoteListMeta,
  getQuoteOutcomeDotClass,
  getQuoteStatusBlurClass,
  getQuoteStatusLabel,
} from '../utils/quoteStatusUi';
import { ChevronRightIcon } from '@heroicons/react/24/outline';
import Link from 'next/link';
import React from 'react';

interface QuoteListRowProps {
  quote: DashboardQuote;
}

export const QuoteListRow: React.FC<QuoteListRowProps> = ({ quote }) => {
  const blur = getQuoteStatusBlurClass(quote.status);
  const outcomeDot = getQuoteOutcomeDotClass(quote.status);
  const vehicle = quote.vehicleLine?.trim() ?? '';

  const priceLine =
    quote.totalCents > 0 ? formatQuoteCurrency(quote.totalCents) : 'Price TBD';

  return (
    <Link
      href={ROUTES.DASHBOARD.QUOTE_DETAIL(quote.id)}
      className="block touch-manipulation"
    >
      <GlassCard
        blurColor={blur}
        rounded="rounded-2xl"
        className="bg-white/[0.02] border-white/[0.06] transition-colors hover:border-white/[0.1] hover:bg-white/[0.03]"
        padding="none"
      >
        <div className="flex items-center gap-3 p-4 sm:gap-4 sm:p-5">
          <div className="min-w-0 flex-1">
            <div className="mb-1 flex items-center gap-2">
              <h3 className="truncate text-base font-bold text-white sm:text-lg">
                {quote.customerName}
              </h3>
              {outcomeDot ? (
                <span
                  className={`h-1.5 w-1.5 shrink-0 rounded-full ${outcomeDot}`}
                  aria-hidden
                />
              ) : null}
            </div>
            {vehicle ? (
              <p className="truncate text-xs font-medium text-zinc-500 sm:text-sm">
                {vehicle}
              </p>
            ) : null}
            <p className="mt-1 text-xs font-medium text-zinc-500 sm:text-sm">
              <span className="text-zinc-400">
                {getQuoteStatusLabel(quote.status)}
              </span>
              <span className="mx-1.5 text-zinc-600">·</span>
              <span>{formatQuoteListMeta(quote.activityAt)}</span>
              <span className="mx-1.5 text-zinc-600">·</span>
              <span>{priceLine}</span>
            </p>
          </div>
          <ChevronRightIcon className="h-5 w-5 shrink-0 text-zinc-600 sm:h-6 sm:w-6" />
        </div>
      </GlassCard>
    </Link>
  );
};
