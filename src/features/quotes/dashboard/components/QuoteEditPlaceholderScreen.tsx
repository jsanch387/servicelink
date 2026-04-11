'use client';

import { Button } from '@/components/shared';
import { ROUTES } from '@/constants/routes';
import { QuoteFlowHeader } from '@/features/quotes/shared/components/QuoteFlowHeader';
import { PlusIcon } from '@heroicons/react/24/outline';
import React from 'react';

interface QuoteEditPlaceholderScreenProps {
  quoteId: string;
}

export const QuoteEditPlaceholderScreen: React.FC<
  QuoteEditPlaceholderScreenProps
> = ({ quoteId }) => {
  return (
    <main className="flex min-h-screen w-full flex-1 flex-col overflow-x-hidden bg-[var(--dashboard-bg)]">
      <div className="mx-auto w-full min-w-0 max-w-3xl flex-1 px-4 py-8 sm:px-6 sm:py-10">
        <QuoteFlowHeader
          backHref={ROUTES.DASHBOARD.QUOTE_DETAIL(quoteId)}
          backLabel="Quote"
          title="Edit quote"
          subtitle="Full quote editing from the dashboard is coming next. For now, create a new quote or adjust details in your records."
        />
        <div className="flex flex-col gap-3 sm:flex-row">
          <Button
            href={ROUTES.DASHBOARD.QUOTES_NEW}
            variant="inverse"
            icon={<PlusIcon className="h-4 w-4" />}
          >
            New quote
          </Button>
          <Button href={ROUTES.DASHBOARD.QUOTES} variant="secondary">
            All quotes
          </Button>
        </div>
      </div>
    </main>
  );
};
