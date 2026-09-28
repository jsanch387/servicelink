'use client';

import { Button } from '@/components/shared';
import { ROUTES } from '@/constants/routes';
import { DocumentTextIcon } from '@heroicons/react/24/outline';
import React from 'react';

import type { InvoiceListFilterId } from '../types';

interface InvoicesListEmptyStateProps {
  filter: InvoiceListFilterId;
  canCreate?: boolean;
}

export const InvoicesListEmptyState: React.FC<InvoicesListEmptyStateProps> = ({
  filter,
  canCreate = true,
}) => {
  const title =
    filter === 'draft'
      ? 'No drafts'
      : filter === 'sent'
        ? 'No sent invoices'
        : filter === 'paid'
          ? 'No paid invoices'
          : 'No invoices yet';

  const description =
    filter === 'all'
      ? 'Send your customer an invoice for the work.'
      : 'Invoices in this status will show up here.';

  return (
    <div className="flex flex-col items-center justify-center rounded-xl border border-white/10 bg-white/[0.02] px-6 py-12 text-center">
      <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-white/10">
        <DocumentTextIcon className="h-8 w-8 text-white" />
      </div>
      <h2 className="mb-2 text-lg font-semibold text-white">{title}</h2>
      <p className="mb-6 max-w-md text-sm text-gray-400">{description}</p>
      {canCreate && filter === 'all' ? (
        <Button
          href={ROUTES.DASHBOARD.INVOICES_NEW}
          variant="primary"
          size="md"
        >
          New invoice
        </Button>
      ) : null}
    </div>
  );
};
