'use client';

import { GlassCard } from '@/components/shared';
import { usePaymentsTransactions } from '../hooks/usePaymentsTransactions';
import {
  PaymentsTransactionsTable,
  PaymentsTransactionsTableSkeleton,
} from './PaymentsTransactionsTable';

export function PaymentsTransactionsList() {
  const {
    items,
    balance,
    loading,
    error,
    page,
    hasPrevious,
    hasNext,
    goToPrevious,
    goToNext,
    reload,
  } = usePaymentsTransactions('all');

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
        <PaymentsTransactionsTableSkeleton />
      ) : items.length === 0 ? (
        <div className="rounded-2xl border border-white/10 px-4 py-14 text-center text-sm text-zinc-500">
          No activity in this view yet
        </div>
      ) : (
        <PaymentsTransactionsTable items={items} />
      )}

      {(hasPrevious || hasNext) && !error ? (
        <div className="flex items-center justify-center gap-3">
          <button
            type="button"
            onClick={goToPrevious}
            disabled={!hasPrevious || loading}
            className="cursor-pointer rounded-xl border border-white/10 bg-white/[0.04] px-4 py-2 text-sm font-medium text-white hover:bg-white/[0.07] disabled:cursor-not-allowed disabled:opacity-40"
          >
            Previous
          </button>
          <span className="min-w-16 text-center text-sm text-zinc-400">
            Page {page}
          </span>
          <button
            type="button"
            onClick={goToNext}
            disabled={!hasNext || loading}
            className="cursor-pointer rounded-xl border border-white/10 bg-white/[0.04] px-4 py-2 text-sm font-medium text-white hover:bg-white/[0.07] disabled:cursor-not-allowed disabled:opacity-40"
          >
            Next
          </button>
        </div>
      ) : null}
    </div>
  );
}
