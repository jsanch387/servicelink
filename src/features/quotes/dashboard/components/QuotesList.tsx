'use client';

import { ROUTES } from '@/constants/routes';
import { splitQuoteServiceDisplayName } from '@/features/quotes/shared/quoteServiceSnapshot';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import React from 'react';
import type { DashboardQuote, DashboardQuoteStatus } from '../types';
import { isPendingCustomerQuoteRequest } from '../utils/pendingCustomerQuoteRequests';
import {
  formatQuoteCurrency,
  formatQuoteListCreatedAt,
  getQuoteStatusLabel,
} from '../utils/quoteStatusUi';

const STATUS_CLASS: Record<DashboardQuoteStatus, string> = {
  requested: 'bg-white/10 text-zinc-300',
  draft: 'bg-white/10 text-zinc-300',
  sent: 'bg-sky-400/15 text-sky-200',
  viewed: 'bg-violet-400/15 text-violet-200',
  approved: 'bg-emerald-400/15 text-emerald-200',
  declined: 'bg-rose-400/15 text-rose-200',
  expired: 'bg-amber-400/15 text-amber-200',
  cancelled: 'bg-white/5 text-zinc-500',
};

function serviceLabel(quote: DashboardQuote): string {
  const title = splitQuoteServiceDisplayName(quote.serviceName).title.trim();
  if (!title || title === 'Untitled service') return '—';
  return title;
}

function amountLabel(quote: DashboardQuote): string {
  if (quote.totalCents > 0) return formatQuoteCurrency(quote.totalCents);
  return 'Price TBD';
}

function createdLabel(quote: DashboardQuote): string {
  return formatQuoteListCreatedAt(quote.createdAt) || '—';
}

function quoteHref(quote: DashboardQuote): string {
  return isPendingCustomerQuoteRequest(quote)
    ? ROUTES.DASHBOARD.QUOTE_REQUEST_DETAIL(quote.id)
    : ROUTES.DASHBOARD.QUOTE_DETAIL(quote.id);
}

function StatusPill({ status }: { status: DashboardQuoteStatus }) {
  return (
    <span
      className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-semibold ${STATUS_CLASS[status]}`}
    >
      {getQuoteStatusLabel(status)}
    </span>
  );
}

export const QuotesList: React.FC<{ quotes: DashboardQuote[] }> = ({
  quotes,
}) => {
  const router = useRouter();

  return (
    <>
      <div className="hidden overflow-x-auto rounded-lg border border-white/10 bg-white/[0.02] md:block">
        <table className="min-w-full">
          <thead>
            <tr className="border-b border-white/10">
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-400">
                Customer
              </th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-400">
                Service
              </th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-400">
                Created
              </th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-400">
                Amount
              </th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-400">
                Status
              </th>
            </tr>
          </thead>
          <tbody>
            {quotes.map(quote => {
              const href = quoteHref(quote);
              return (
                <tr
                  key={quote.id}
                  tabIndex={0}
                  aria-label={`Open quote for ${quote.customerName}`}
                  onClick={() => router.push(href)}
                  onKeyDown={event => {
                    if (event.key === 'Enter' || event.key === ' ') {
                      event.preventDefault();
                      router.push(href);
                    }
                  }}
                  className="cursor-pointer border-b border-white/5 transition-colors last:border-0 hover:bg-white/[0.03] focus-visible:bg-white/[0.04] focus-visible:outline-none"
                >
                  <td className="max-w-[16rem] px-4 py-3.5 align-middle">
                    <span className="block truncate text-sm font-semibold text-white">
                      {quote.customerName}
                    </span>
                  </td>
                  <td className="max-w-[14rem] px-4 py-3.5 align-middle text-sm text-gray-300">
                    <span className="block truncate">
                      {serviceLabel(quote)}
                    </span>
                  </td>
                  <td className="px-4 py-3.5 align-middle text-sm text-gray-300">
                    {createdLabel(quote)}
                  </td>
                  <td className="px-4 py-3.5 align-middle text-sm font-medium tabular-nums text-white">
                    {amountLabel(quote)}
                  </td>
                  <td className="px-4 py-3.5 align-middle">
                    <StatusPill status={quote.status} />
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <ul className="flex list-none flex-col gap-3 md:hidden">
        {quotes.map(quote => (
          <li key={quote.id}>
            <Link
              href={quoteHref(quote)}
              className="block cursor-pointer rounded-lg border border-white/10 bg-white/[0.02] p-4 outline-none transition-colors hover:bg-white/[0.04] focus-visible:ring-2 focus-visible:ring-white/30"
            >
              <div className="flex items-start justify-between gap-3">
                <p className="min-w-0 truncate text-base font-semibold text-white">
                  {quote.customerName}
                </p>
                <StatusPill status={quote.status} />
              </div>
              <dl className="mt-3 space-y-2 text-sm">
                <div className="flex justify-between gap-4">
                  <dt className="text-gray-400">Service</dt>
                  <dd className="min-w-0 truncate text-gray-200">
                    {serviceLabel(quote)}
                  </dd>
                </div>
                <div className="flex justify-between gap-4">
                  <dt className="text-gray-400">Created</dt>
                  <dd className="text-gray-200">{createdLabel(quote)}</dd>
                </div>
                <div className="flex justify-between gap-4">
                  <dt className="text-gray-400">Amount</dt>
                  <dd className="font-medium tabular-nums text-white">
                    {amountLabel(quote)}
                  </dd>
                </div>
              </dl>
            </Link>
          </li>
        ))}
      </ul>
    </>
  );
};
