'use client';

import { Button } from '@/components/shared';
import { ROUTES } from '@/constants/routes';
import { ProFeatureLabel } from '@/features/dashboard';
import { InboxIcon, PlusIcon } from '@heroicons/react/24/outline';
import Link from 'next/link';
import React, { useMemo, useState } from 'react';
import { useDashboardQuotes } from '../hooks/useDashboardQuotes';
import type { QuotesDashboardFilterId } from '../types';
import { countPendingCustomerQuoteRequests } from '../utils/pendingCustomerQuoteRequests';
import { quoteMatchesFilter } from '../utils/quoteStatusUi';
import { QuoteListRow } from './QuoteListRow';
import { QuotesDashboardSkeleton } from './QuotesDashboardSkeleton';
import { QuotesFilterPills } from './QuotesFilterPills';
import { QuotesListEmptyState } from './QuotesListEmptyState';

export interface QuotesDashboardPageProps {
  /** When true, show Pro label on the quote-requests row (upgrade nudge). */
  isFreeTier?: boolean;
}

export const QuotesDashboardPage: React.FC<QuotesDashboardPageProps> = ({
  isFreeTier = false,
}) => {
  const [filter, setFilter] = useState<QuotesDashboardFilterId>('all');
  const { quotes, loadStatus, loadError, reloadQuotes } = useDashboardQuotes();

  const filtered = useMemo(
    () => quotes.filter(q => quoteMatchesFilter(q.status, filter)),
    [quotes, filter]
  );

  const sorted = useMemo(
    () =>
      [...filtered].sort(
        (a, b) =>
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      ),
    [filtered]
  );

  const hasAnyQuotes = quotes.length > 0;

  const requestCount = useMemo(
    () => countPendingCustomerQuoteRequests(quotes),
    [quotes]
  );

  const mainContent = (() => {
    if (loadStatus === 'loading') {
      return <QuotesDashboardSkeleton />;
    }
    if (loadStatus === 'error') {
      return (
        <div className="rounded-2xl border border-red-400/20 bg-red-400/10 p-4 sm:p-5">
          <p className="text-sm text-red-200">
            {loadError || 'Failed to load quotes.'}
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
      );
    }
    if (!hasAnyQuotes) {
      return <QuotesListEmptyState filter={filter} hasAnyQuotes={false} />;
    }
    if (sorted.length === 0) {
      return <QuotesListEmptyState filter={filter} hasAnyQuotes />;
    }
    return (
      <ul className="flex list-none flex-col gap-2 pb-8 sm:gap-3 sm:pb-10">
        {sorted.map(quote => (
          <li key={quote.id}>
            <QuoteListRow quote={quote} />
          </li>
        ))}
      </ul>
    );
  })();

  return (
    <main className="flex min-h-screen w-full flex-1 flex-col overflow-x-hidden bg-[var(--dashboard-bg)]">
      <div className="mx-auto w-full min-w-0 max-w-3xl flex-1 px-4 py-8 sm:px-6 sm:py-10 lg:px-8 lg:py-10">
        <header className="mb-6 flex flex-col gap-4 sm:mb-8 sm:flex-row sm:items-start sm:justify-between">
          <div className="min-w-0">
            <h1 className="text-2xl font-black tracking-tight text-white sm:text-3xl">
              Quotes
            </h1>
            <p className="mt-1 text-sm text-gray-500">
              Sent quotes, statuses, and customer links in one place.
            </p>
          </div>
          <Button
            href={ROUTES.DASHBOARD.QUOTES_NEW}
            variant="inverse"
            size="md"
            icon={<PlusIcon className="h-4 w-4" />}
            className="w-full shrink-0 sm:w-auto"
          >
            New quote
          </Button>
        </header>

        <Link
          href={ROUTES.DASHBOARD.QUOTES_REQUESTS}
          className="mb-6 flex items-center justify-between rounded-2xl border border-white/[0.06] bg-white/[0.02] px-4 py-3 transition-colors hover:border-white/[0.12] hover:bg-white/[0.03]"
        >
          <div className="flex min-w-0 items-center gap-3">
            <span className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-white/[0.04]">
              <InboxIcon className="h-5 w-5 text-zinc-400" aria-hidden />
            </span>
            <span className="flex min-w-0 flex-wrap items-center gap-2">
              <span className="text-sm font-semibold text-white">
                Quote requests
              </span>
              {isFreeTier ? <ProFeatureLabel /> : null}
            </span>
          </div>
          <span
            className="rounded-full bg-white/[0.06] px-2.5 py-1 text-xs font-semibold text-gray-300 ring-1 ring-inset ring-white/10"
            aria-label={
              loadStatus === 'loading'
                ? 'Request count loading'
                : `${requestCount} open requests`
            }
          >
            {loadStatus === 'loading' ? '–' : requestCount}
          </span>
        </Link>

        {loadStatus === 'ready' && hasAnyQuotes ? (
          <div className="mb-4">
            <QuotesFilterPills value={filter} onChange={setFilter} />
            <p className="mt-3 text-xs text-gray-500">
              Showing {sorted.length} of {quotes.length} quotes
            </p>
          </div>
        ) : null}

        {mainContent}
      </div>
    </main>
  );
};
