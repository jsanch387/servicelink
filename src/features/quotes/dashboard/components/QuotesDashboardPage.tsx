'use client';

import { Button } from '@/components/shared';
import { ROUTES } from '@/constants/routes';
import { PlusIcon } from '@heroicons/react/24/outline';
import React, { useMemo, useState } from 'react';
import { useDashboardQuotes } from '../hooks/useDashboardQuotes';
import type { QuotesDashboardFilterId } from '../types';
import { quoteMatchesFilter } from '../utils/quoteStatusUi';
import { QuoteListRow } from './QuoteListRow';
import { QuotesDashboardSkeleton } from './QuotesDashboardSkeleton';
import { QuotesFilterPills } from './QuotesFilterPills';
import { QuotesListEmptyState } from './QuotesListEmptyState';

export const QuotesDashboardPage: React.FC = () => {
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
          new Date(b.activityAt).getTime() - new Date(a.activityAt).getTime()
      ),
    [filtered]
  );

  const hasAnyQuotes = quotes.length > 0;

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

        {loadStatus === 'ready' && hasAnyQuotes ? (
          <div className="mb-4">
            <QuotesFilterPills value={filter} onChange={setFilter} />
            <p className="mt-3 text-xs text-gray-500">
              Showing {sorted.length} of {quotes.length} quotes
            </p>
          </div>
        ) : null}

        {loadStatus === 'loading' ? (
          <QuotesDashboardSkeleton />
        ) : loadStatus === 'error' ? (
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
        ) : !hasAnyQuotes ? (
          <QuotesListEmptyState filter={filter} hasAnyQuotes={false} />
        ) : sorted.length === 0 ? (
          <QuotesListEmptyState filter={filter} hasAnyQuotes />
        ) : (
          <ul className="flex list-none flex-col gap-2 pb-8 sm:gap-3 sm:pb-10">
            {sorted.map(quote => (
              <li key={quote.id}>
                <QuoteListRow quote={quote} />
              </li>
            ))}
          </ul>
        )}
      </div>
    </main>
  );
};
