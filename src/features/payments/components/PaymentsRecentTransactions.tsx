import {
  MOCK_RECENT_TRANSACTIONS,
  type MockPaymentTransactionStatus,
} from '@/features/payments/data/mockPayments';
import { formatPaymentCents } from '@/features/payments/utils/formatPaymentMoney';
import React from 'react';

function statusStyles(status: MockPaymentTransactionStatus): string {
  switch (status) {
    case 'succeeded':
      return 'border-emerald-400/25 bg-emerald-500/10 text-emerald-200';
    case 'pending':
      return 'border-amber-400/25 bg-amber-500/10 text-amber-200';
    case 'refunded':
      return 'border-white/10 bg-white/5 text-gray-300';
    default:
      return 'border-white/10 bg-white/5 text-gray-300';
  }
}

function statusLabel(status: MockPaymentTransactionStatus): string {
  switch (status) {
    case 'succeeded':
      return 'Succeeded';
    case 'pending':
      return 'Pending';
    case 'refunded':
      return 'Refunded';
    default:
      return status;
  }
}

export interface PaymentsRecentTransactionsProps {
  /** Omit default top margin when the parent page already sets spacing (e.g. transactions sub-page). */
  noSectionTopMargin?: boolean;
  /** Hide the section heading (e.g. when the page title is already “Recent transactions”). */
  hideHeading?: boolean;
}

export const PaymentsRecentTransactions: React.FC<
  PaymentsRecentTransactionsProps
> = ({ noSectionTopMargin = false, hideHeading = false }) => {
  return (
    <section className={noSectionTopMargin ? '' : 'mt-8 sm:mt-10'}>
      {hideHeading ? null : (
        <h2 className="text-lg font-semibold text-white mb-4">
          Recent transactions
        </h2>
      )}
      <div className="hidden md:block overflow-x-auto rounded-lg border border-white/10 bg-white/[0.02]">
        <table className="min-w-full">
          <thead>
            <tr className="border-b border-white/10">
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-400">
                Date
              </th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-400">
                Description
              </th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-400">
                Customer
              </th>
              <th className="px-4 py-3 text-right text-xs font-semibold text-gray-400">
                Amount
              </th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-400">
                Status
              </th>
            </tr>
          </thead>
          <tbody>
            {MOCK_RECENT_TRANSACTIONS.map(tx => (
              <tr
                key={tx.id}
                className="border-b border-white/5 last:border-0 hover:bg-white/[0.03] transition-colors"
              >
                <td className="px-4 py-3 text-sm text-gray-200 whitespace-nowrap">
                  {tx.dateLabel}
                </td>
                <td className="px-4 py-3 text-sm text-white">
                  {tx.description}
                </td>
                <td className="px-4 py-3 text-sm text-gray-400">
                  {tx.customerName ?? '—'}
                </td>
                <td className="px-4 py-3 text-sm text-right font-medium tabular-nums text-white">
                  {formatPaymentCents(tx.amountCents)}
                </td>
                <td className="px-4 py-3">
                  <span
                    className={`inline-flex rounded-full border px-2.5 py-0.5 text-xs font-semibold ${statusStyles(tx.status)}`}
                  >
                    {statusLabel(tx.status)}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <ul className="md:hidden space-y-3">
        {MOCK_RECENT_TRANSACTIONS.map(tx => (
          <li
            key={tx.id}
            className="rounded-xl border border-white/10 bg-white/[0.02] p-4"
          >
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="text-sm font-semibold text-white">
                  {tx.description}
                </p>
                <p className="text-xs text-gray-500 mt-1">{tx.dateLabel}</p>
                {tx.customerName ? (
                  <p className="text-xs text-gray-400 mt-1">
                    {tx.customerName}
                  </p>
                ) : null}
              </div>
              <div className="text-right shrink-0">
                <p className="text-sm font-semibold tabular-nums text-white">
                  {formatPaymentCents(tx.amountCents)}
                </p>
                <span
                  className={`mt-2 inline-flex rounded-full border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${statusStyles(tx.status)}`}
                >
                  {statusLabel(tx.status)}
                </span>
              </div>
            </div>
          </li>
        ))}
      </ul>
    </section>
  );
};
