import { ROUTES } from '@/constants/routes';
import { ArrowLeftIcon } from '@heroicons/react/24/outline';
import Link from 'next/link';
import React from 'react';

import { InvoiceBillActions } from './InvoiceBillActions';
import {
  PublicInvoiceBill,
  type PublicInvoiceBillModel,
} from './PublicInvoiceBill';

export const InvoiceBillScreen: React.FC<{
  invoice: PublicInvoiceBillModel;
  invoiceId: string;
}> = ({ invoice, invoiceId }) => {
  return (
    <div className="flex w-full flex-1 flex-col bg-[var(--dashboard-bg)]">
      <div className="flex w-full flex-col gap-3 px-4 pt-6 sm:flex-row sm:items-center sm:justify-between sm:px-6 lg:px-8">
        <Link
          href={ROUTES.DASHBOARD.INVOICES}
          className="-ml-1 inline-flex cursor-pointer items-center gap-2 text-sm font-medium text-zinc-400 transition-colors hover:text-white"
        >
          <ArrowLeftIcon className="h-4 w-4 shrink-0" aria-hidden />
          Invoices
        </Link>
        <InvoiceBillActions
          invoiceId={invoiceId}
          status={invoice.status}
          shortCode={invoice.shortCode ?? null}
        />
      </div>
      <PublicInvoiceBill invoice={invoice} embedded />
    </div>
  );
};
