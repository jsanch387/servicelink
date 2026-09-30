'use client';

import { Button } from '@/components/shared';
import { ROUTES } from '@/constants/routes';
import { useDashboardAccess } from '@/features/dashboard/context/DashboardAccessContext';
import { PlusIcon } from '@heroicons/react/24/outline';
import React, { useMemo, useState } from 'react';

import { useDashboardInvoices } from '../hooks/useDashboardInvoices';
import type { InvoiceListFilterId } from '../types';
import { InvoicesFilterPills } from './InvoicesFilterPills';
import { InvoicesListEmptyState } from './InvoicesListEmptyState';
import { InvoicesListSkeleton } from './InvoicesDashboardSkeleton';
import { InvoicesTable } from './InvoicesTable';

export const InvoicesDashboardPage: React.FC = () => {
  const [filter, setFilter] = useState<InvoiceListFilterId>('all');
  const canWriteInvoices = useDashboardAccess().can('invoices.write');
  const { invoices, loadStatus, loadError, reloadInvoices } =
    useDashboardInvoices();

  const visible = useMemo(
    () =>
      filter === 'all'
        ? invoices
        : invoices.filter(invoice => invoice.status === filter),
    [filter, invoices]
  );

  const list = (() => {
    if (loadStatus === 'loading') {
      return (
        <div role="status" aria-label="Loading invoices">
          <span className="sr-only">Loading invoices</span>
          <InvoicesListSkeleton />
        </div>
      );
    }

    if (loadStatus === 'error') {
      return (
        <div className="rounded-2xl border border-red-400/20 bg-red-400/10 p-4 sm:p-5">
          <p className="text-sm text-red-200">
            {loadError || 'Could not load invoices.'}
          </p>
          <Button
            variant="secondary"
            size="sm"
            onClick={() => void reloadInvoices()}
            className="mt-3"
          >
            Try again
          </Button>
        </div>
      );
    }

    if (visible.length === 0) {
      return (
        <InvoicesListEmptyState filter={filter} canCreate={canWriteInvoices} />
      );
    }

    return <InvoicesTable invoices={visible} />;
  })();

  return (
    <div className="flex h-full flex-col">
      <div className="flex-1 overflow-y-auto">
        <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
          <header className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div className="min-w-0">
              <h1 className="text-3xl font-bold leading-none text-white">
                Invoices
              </h1>
              <p className="mt-1 text-gray-400">
                Create and send invoices to your customers.
              </p>
            </div>
            {canWriteInvoices ? (
              <Button
                href={ROUTES.DASHBOARD.INVOICES_NEW}
                variant="inverse"
                size="sm"
                icon={<PlusIcon className="h-4 w-4" />}
                className="w-full shrink-0 sm:w-auto"
              >
                New invoice
              </Button>
            ) : null}
          </header>

          {loadStatus === 'ready' ? (
            <div className="mb-6">
              <InvoicesFilterPills value={filter} onChange={setFilter} />
            </div>
          ) : null}

          {list}
        </div>
      </div>
    </div>
  );
};
