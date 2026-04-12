'use client';

import { Button } from '@/components/shared';
import { ROUTES } from '@/constants/routes';
import type { QuotesDashboardFilterId } from '../types';
import {
  ClipboardDocumentListIcon,
  PlusIcon,
} from '@heroicons/react/24/outline';
import React from 'react';

interface QuotesListEmptyStateProps {
  filter: QuotesDashboardFilterId;
  hasAnyQuotes: boolean;
}

export const QuotesListEmptyState: React.FC<QuotesListEmptyStateProps> = ({
  filter,
  hasAnyQuotes,
}) => {
  const title = !hasAnyQuotes
    ? 'No quotes yet'
    : filter === 'open'
      ? 'No open quotes'
      : filter === 'closed'
        ? 'No closed quotes'
        : 'No quotes';

  const description = !hasAnyQuotes
    ? 'Send your first quote in a few taps — your customer gets a link to review and respond.'
    : filter === 'all'
      ? 'Try another filter or create a new quote.'
      : 'Nothing in this filter right now. Try All or create a new quote.';

  return (
    <div className="flex flex-col items-center justify-center rounded-2xl border border-white/[0.06] bg-white/[0.02] px-6 py-16 text-center">
      <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-zinc-900">
        <ClipboardDocumentListIcon className="h-8 w-8 text-zinc-600" />
      </div>
      <h2 className="text-lg font-bold text-zinc-200">{title}</h2>
      <p className="mt-1 max-w-sm text-sm text-zinc-500">{description}</p>
      <Button
        href={ROUTES.DASHBOARD.QUOTES_NEW}
        variant="inverse"
        icon={<PlusIcon className="h-4 w-4" />}
        className="mt-6"
      >
        New quote
      </Button>
    </div>
  );
};
