'use client';

import React from 'react';

import { formatExpenseCents } from '../utils/parseExpense';

export const ExpensesSummary: React.FC<{
  monthCents: number;
  yearCents: number;
  monthLabel?: string;
  yearLabel?: string;
}> = ({
  monthCents,
  yearCents,
  monthLabel = 'This month',
  yearLabel = 'This year',
}) => {
  return (
    <div className="mb-6 grid gap-3 sm:grid-cols-2">
      <section className="rounded-xl border border-white/10 bg-white/[0.03] px-4 py-4">
        <p className="text-sm text-gray-400">{monthLabel}</p>
        <p className="mt-1 text-2xl font-semibold tabular-nums text-white">
          {formatExpenseCents(monthCents)}
        </p>
      </section>
      <section className="rounded-xl border border-white/10 bg-white/[0.03] px-4 py-4">
        <p className="text-sm text-gray-400">{yearLabel}</p>
        <p className="mt-1 text-2xl font-semibold tabular-nums text-white">
          {formatExpenseCents(yearCents)}
        </p>
      </section>
    </div>
  );
};
