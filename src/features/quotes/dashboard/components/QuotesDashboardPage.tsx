'use client';

import {
  Button,
  ListPagination,
  listPageCount,
  listPageItems,
} from '@/components/shared';
import { ROUTES } from '@/constants/routes';
import { useDashboardAccess } from '@/features/dashboard/context/DashboardAccessContext';
import { PlusIcon } from '@heroicons/react/24/outline';
import React, { useEffect, useMemo, useState } from 'react';
import { useDashboardQuotes } from '../hooks/useDashboardQuotes';
import type { QuotesDashboardFilterId } from '../types';
import { quoteMatchesFilter } from '../utils/quoteStatusUi';
import { QuotesAcceptRequestsUpgradeCta } from './QuotesAcceptRequestsUpgradeCta';
import { QuotesDashboardSkeleton } from './QuotesDashboardSkeleton';
import { QuotesFilters } from './QuotesFilters';
import { QuotesList } from './QuotesList';
import { QuotesListEmptyState } from './QuotesListEmptyState';

const QUOTE_PAGE_SIZE = 10;

export interface QuotesDashboardPageProps {
  /** Free-tier owners see an upgrade CTA to accept quote requests. */
  isFreeTier?: boolean;
}

export const QuotesDashboardPage: React.FC<QuotesDashboardPageProps> = ({
  isFreeTier = false,
}) => {
  const [filter, setFilter] = useState<QuotesDashboardFilterId>('all');
  const [page, setPage] = useState(0);
  const { quotes, loadStatus, loadError, reloadQuotes } = useDashboardQuotes();
  const canWriteQuotes = useDashboardAccess().can('quotes.write');

  const sorted = useMemo(() => {
    return quotes
      .filter(quote => quoteMatchesFilter(quote.status, filter))
      .sort(
        (a, b) =>
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );
  }, [quotes, filter]);

  const pageCount = listPageCount(sorted.length, QUOTE_PAGE_SIZE);
  const currentPage = Math.min(page, pageCount - 1);
  const pageQuotes = listPageItems(sorted, currentPage, QUOTE_PAGE_SIZE);
  const hasAnyQuotes = quotes.length > 0;

  useEffect(() => {
    setPage(0);
  }, [filter]);

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
      return (
        <QuotesListEmptyState
          filter={filter}
          hasAnyQuotes={false}
          canCreate={canWriteQuotes}
        />
      );
    }
    if (sorted.length === 0) {
      return (
        <QuotesListEmptyState filter={filter} hasAnyQuotes canCreate={false} />
      );
    }
    return (
      <>
        <QuotesList quotes={pageQuotes} />
        <ListPagination
          page={currentPage}
          pageCount={pageCount}
          onPageChange={setPage}
        />
      </>
    );
  })();

  return (
    <div className="flex h-full min-h-0 flex-col">
      <div className="flex-1 overflow-y-auto">
        <div className="mx-auto w-full min-w-0 max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
          <header className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div className="min-w-0">
              <h1 className="text-3xl font-bold leading-none text-white">
                Quotes
              </h1>
              <p className="mt-1 text-gray-400">
                Sent quotes, statuses, and customer links in one place.
              </p>
            </div>
            {canWriteQuotes ? (
              <Button
                href={ROUTES.DASHBOARD.QUOTES_NEW}
                variant="inverse"
                size="sm"
                icon={<PlusIcon className="h-4 w-4" />}
                className="w-full shrink-0 sm:w-auto"
              >
                New quote
              </Button>
            ) : null}
          </header>

          {isFreeTier ? (
            <div className="mb-6">
              <QuotesAcceptRequestsUpgradeCta />
            </div>
          ) : null}

          {loadStatus === 'ready' && hasAnyQuotes ? (
            <QuotesFilters value={filter} onChange={setFilter} />
          ) : null}

          {mainContent}
        </div>
      </div>
    </div>
  );
};
