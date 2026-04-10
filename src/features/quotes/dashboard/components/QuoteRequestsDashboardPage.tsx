'use client';

import { Button } from '@/components/shared';
import { ROUTES } from '@/constants/routes';
import { ArrowLeftIcon, InboxIcon } from '@heroicons/react/24/outline';
import Link from 'next/link';
import React, { useMemo } from 'react';
import { useDashboardQuotes } from '../hooks/useDashboardQuotes';
import { listPendingCustomerQuoteRequestsNewestFirst } from '../utils/pendingCustomerQuoteRequests';
import { QuoteListRow } from './QuoteListRow';
import { QuotesDashboardSkeleton } from './QuotesDashboardSkeleton';

export const QuoteRequestsDashboardPage: React.FC = () => {
  const { quotes, loadStatus, loadError, reloadQuotes } = useDashboardQuotes();

  const requestRows = useMemo(
    () => listPendingCustomerQuoteRequestsNewestFirst(quotes),
    [quotes]
  );

  return (
    <main className="flex min-h-screen w-full flex-1 flex-col overflow-x-hidden bg-[var(--dashboard-bg)]">
      <div className="mx-auto w-full min-w-0 max-w-3xl flex-1 px-4 py-8 sm:px-6 sm:py-10 lg:px-8 lg:py-10">
        <div className="mb-6">
          <Link
            href={ROUTES.DASHBOARD.QUOTES}
            className="mb-4 inline-flex items-center gap-2 text-sm font-medium text-zinc-400 transition-colors hover:text-white"
          >
            <ArrowLeftIcon className="h-4 w-4" aria-hidden />
            Quotes
          </Link>
          <header className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
            <div className="min-w-0">
              <h1 className="text-2xl font-black tracking-tight text-white sm:text-3xl">
                Requests
              </h1>
              <p className="mt-1 text-sm text-gray-500">
                These are not quotes yet — open one, then create and send the
                quote.
              </p>
            </div>
          </header>
        </div>

        {loadStatus === 'loading' ? (
          <QuotesDashboardSkeleton />
        ) : loadStatus === 'error' ? (
          <div className="rounded-2xl border border-red-400/20 bg-red-400/10 p-4 sm:p-5">
            <p className="text-sm text-red-200">
              {loadError || 'Failed to load requests.'}
            </p>
            <Button
              variant="secondary"
              size="sm"
              onClick={() => void reloadQuotes()}
              className="mt-3"
            >
              Try again
            </Button>
          </div>
        ) : requestRows.length === 0 ? (
          <div className="rounded-2xl border border-white/[0.06] bg-white/[0.02] px-4 py-10 text-center sm:px-6">
            <span className="mx-auto mb-3 inline-flex h-12 w-12 items-center justify-center rounded-xl bg-white/[0.04]">
              <InboxIcon className="h-6 w-6 text-zinc-500" />
            </span>
            <p className="text-sm font-medium text-white">No open requests</p>
            <p className="mx-auto mt-1 max-w-sm text-xs text-gray-500">
              When a customer asks for a quote, it will show up here.
            </p>
          </div>
        ) : (
          <ul className="flex list-none flex-col gap-2 pb-8 sm:gap-3 sm:pb-10">
            {requestRows.map(quote => (
              <li key={quote.id}>
                <QuoteListRow
                  quote={quote}
                  detailHref={ROUTES.DASHBOARD.QUOTE_REQUEST_DETAIL(quote.id)}
                />
              </li>
            ))}
          </ul>
        )}
      </div>
    </main>
  );
};
