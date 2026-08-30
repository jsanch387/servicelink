'use client';

import { FilterPills, GlassCard } from '@/components/shared';
import React, { useState } from 'react';
import {
  usePaymentsTransactions,
  type PaymentsTransactionsKindFilter,
} from '../hooks/usePaymentsTransactions';
import { groupTransactionsByDate } from '../transactions/publicTransaction';
import type { PaymentsTransactionListItem } from '../transactions/publicTransaction';
import { TRANSACTIONS_LEDGER_CAPTION } from '../constants/stripeProcessingFees';
import { paymentsSourceColor } from '../utils/paymentsSourceColors';

const KIND_OPTIONS: { id: PaymentsTransactionsKindFilter; label: string }[] = [
  { id: 'all', label: 'All' },
  { id: 'payment', label: 'Collected' },
  { id: 'refund', label: 'Refunds' },
  { id: 'payout', label: 'Payouts' },
];

export function PaymentsTransactionsList({
  stripeConnectReady = false,
}: {
  stripeConnectReady?: boolean;
}) {
  const [kind, setKind] = useState<PaymentsTransactionsKindFilter>('all');
  const {
    items,
    balance,
    hasMore,
    loading,
    loadingMore,
    error,
    loadMore,
    reload,
  } = usePaymentsTransactions(kind);
  const groups = groupTransactionsByDate(items);

  return (
    <div className="space-y-5">
      {balance ? (
        <GlassCard
          padding="none"
          rounded="rounded-2xl"
          className="px-4 py-4 sm:px-5"
        >
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-xs font-medium text-zinc-500">
                {balance.availableCaption}
              </p>
              <p className="mt-1 text-xl font-semibold tracking-tight text-white tabular-nums sm:text-2xl">
                {balance.availableLabel}
              </p>
            </div>
            <div className="border-l border-white/[0.08] pl-4">
              <p className="text-xs font-medium text-zinc-500">
                {balance.pendingCaption}
              </p>
              <p className="mt-1 text-xl font-semibold tracking-tight text-white tabular-nums sm:text-2xl">
                {balance.pendingLabel}
              </p>
            </div>
          </div>
        </GlassCard>
      ) : null}

      <div>
        <FilterPills
          options={KIND_OPTIONS}
          value={kind}
          onChange={setKind}
          ariaLabel="Transaction type"
          size="sm"
        />
        {stripeConnectReady ? (
          <p className="mt-2 text-xs leading-relaxed text-zinc-500">
            {TRANSACTIONS_LEDGER_CAPTION}
          </p>
        ) : null}
      </div>

      {error ? (
        <div className="flex flex-col items-center justify-center gap-2 rounded-2xl border border-white/10 px-4 py-14 text-center">
          <p className="text-sm text-zinc-400">{error}</p>
          <button
            type="button"
            onClick={reload}
            className="cursor-pointer text-sm font-medium text-white underline-offset-2 hover:underline"
          >
            Try again
          </button>
        </div>
      ) : loading ? (
        <div className="space-y-2">
          {[1, 2, 3, 4].map(row => (
            <div
              key={row}
              className="h-16 animate-pulse rounded-xl bg-white/[0.04]"
            />
          ))}
        </div>
      ) : groups.length === 0 ? (
        <div className="rounded-2xl border border-white/10 px-4 py-14 text-center text-sm text-zinc-500">
          No activity in this view yet
        </div>
      ) : (
        <div className="space-y-5">
          {groups.map(group => (
            <section key={group.dateLabel}>
              <h2 className="mb-1.5 text-xs font-medium text-zinc-500">
                {group.dateLabel}
              </h2>
              <ul className="overflow-hidden rounded-2xl border border-white/[0.08] bg-white/[0.02]">
                {group.items.map(item => (
                  <PaymentsTransactionRow key={item.id} item={item} />
                ))}
              </ul>
            </section>
          ))}
        </div>
      )}

      {hasMore && !error ? (
        <div className="flex justify-center">
          <button
            type="button"
            onClick={() => void loadMore()}
            disabled={loadingMore}
            className="cursor-pointer rounded-xl border border-white/10 bg-white/[0.04] px-4 py-2 text-sm font-medium text-white hover:bg-white/[0.07] disabled:cursor-not-allowed disabled:opacity-60"
          >
            {loadingMore ? 'Loading…' : 'Load more'}
          </button>
        </div>
      ) : null}
    </div>
  );
}

function PaymentsTransactionRow({
  item,
}: {
  item: PaymentsTransactionListItem;
}) {
  const amountClass =
    item.tone === 'in'
      ? 'text-emerald-400'
      : item.tone === 'out'
        ? 'text-red-400'
        : 'text-zinc-300';
  const showStatus = item.statusLabel.trim() && item.statusLabel !== 'Paid';
  const detail = item.subtitle?.trim() || (showStatus ? item.statusLabel : '');

  return (
    <li className="flex items-center gap-3 border-b border-white/[0.06] px-3.5 py-3 last:border-b-0 sm:px-4">
      <span
        className="h-2.5 w-2.5 shrink-0 rounded-full"
        style={{ backgroundColor: paymentsSourceColor(item.source) }}
        aria-hidden
      />
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium text-white">
          {item.title}
          {item.extraCount > 0 ? (
            <span className="ml-1.5 text-xs font-normal text-zinc-500">
              +{item.extraCount} more
            </span>
          ) : null}
        </p>
        {detail ? (
          <p className="mt-0.5 truncate text-xs text-zinc-500">{detail}</p>
        ) : null}
      </div>
      <div className="shrink-0 text-right">
        <p className={`text-sm font-semibold tabular-nums ${amountClass}`}>
          {item.amountLabel}
        </p>
        {item.feeLabel ? (
          <p className="mt-0.5 text-xs tabular-nums text-zinc-500">
            {item.feeLabel}
          </p>
        ) : null}
      </div>
    </li>
  );
}
