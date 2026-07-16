'use client';

import { GlassCard } from '@/components/shared';
import { ROUTES } from '@/constants/routes';
import { splitQuoteServiceDisplayName } from '@/features/quotes/shared/quoteServiceSnapshot';
import { ChevronRightIcon } from '@heroicons/react/24/outline';
import Link from 'next/link';
import React from 'react';
import type { DashboardQuote } from '../types';
import {
  formatQuoteCurrency,
  formatQuoteListCreatedAt,
  getQuoteOutcomeDotClass,
  getQuoteStatusBlurClass,
  getQuoteStatusLabel,
} from '../utils/quoteStatusUi';

interface QuoteListRowProps {
  quote: DashboardQuote;
  /** Detail URL when the row is a link (default: owner quote detail). */
  detailHref?: string;
  /** Small label next to the customer name (e.g. demo rows). */
  tag?: string;
}

export const QuoteListRow: React.FC<QuoteListRowProps> = ({
  quote,
  detailHref,
  tag,
}) => {
  const blur = getQuoteStatusBlurClass(quote.status);
  const outcomeDot = getQuoteOutcomeDotClass(quote.status);
  const service = splitQuoteServiceDisplayName(quote.serviceName).title;
  const showService = service.length > 0 && service !== 'Untitled service';

  const priceLine =
    quote.totalCents > 0 ? formatQuoteCurrency(quote.totalCents) : 'Price TBD';

  const createdLabel = formatQuoteListCreatedAt(quote.createdAt);

  const inner = (
    <GlassCard
      blurColor={blur}
      rounded="rounded-2xl"
      className="bg-white/[0.02] border-white/[0.06] transition-colors hover:border-white/[0.1] hover:bg-white/[0.03]"
      padding="none"
    >
      <div className="relative p-4 sm:p-5">
        <div className="flex min-w-0 items-start justify-between gap-3">
          <div className="flex min-w-0 flex-wrap items-center gap-2">
            <h3 className="truncate text-base font-bold text-white sm:text-lg">
              {quote.customerName}
            </h3>
            {tag ? (
              <span className="shrink-0 rounded-md bg-amber-500/15 px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-amber-200/90 ring-1 ring-inset ring-amber-400/25">
                {tag}
              </span>
            ) : null}
          </div>
          <span className="inline-flex shrink-0 items-center gap-1.5 rounded-full bg-white/[0.07] px-2.5 py-1 text-xs font-medium text-gray-300 ring-1 ring-inset ring-white/10">
            {outcomeDot ? (
              <span
                className={`h-1.5 w-1.5 shrink-0 rounded-full ${outcomeDot}`}
                aria-hidden
              />
            ) : null}
            {getQuoteStatusLabel(quote.status)}
          </span>
        </div>
        <div className="mt-1 min-w-0 pr-8">
          {showService ? (
            <p
              className="truncate text-sm font-medium text-zinc-300"
              title={service}
            >
              {service}
            </p>
          ) : null}
          <p className="mt-1.5 text-xs font-medium text-zinc-500 sm:text-sm">
            {createdLabel ? <span>Created {createdLabel}</span> : null}
            {createdLabel ? (
              <span className="mx-1.5 text-zinc-600">·</span>
            ) : null}
            <span>{priceLine}</span>
          </p>
        </div>
        <ChevronRightIcon className="absolute bottom-4 right-4 h-5 w-5 text-zinc-600 sm:bottom-5 sm:right-5" />
      </div>
    </GlassCard>
  );

  const href = detailHref ?? ROUTES.DASHBOARD.QUOTE_DETAIL(quote.id);

  return (
    <Link href={href} className="block touch-manipulation">
      {inner}
    </Link>
  );
};
