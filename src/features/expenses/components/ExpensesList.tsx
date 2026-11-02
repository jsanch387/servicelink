'use client';

import { Button, IconButton, ListPagination, Modal } from '@/components/shared';
import { TrashIcon } from '@heroicons/react/24/outline';
import React, { useEffect, useState } from 'react';

import { expenseCategoryLabel } from '../constants';
import type { ExpenseListItem } from '../types';
import { expensePageCount, expensePageItems } from '../utils/expenseTotals';
import { formatExpenseCents, formatExpenseDate } from '../utils/parseExpense';

export const ExpensesList: React.FC<{
  expenses: ExpenseListItem[];
  canWrite: boolean;
  /** Changes when the month or category changes, so the list returns to page 1. */
  resetKey: string;
  onEdit: (expense: ExpenseListItem) => void;
  onRemove: (
    expense: ExpenseListItem
  ) => Promise<{ ok: boolean; error?: string }>;
}> = ({ expenses, canWrite, resetKey, onEdit, onRemove }) => {
  const [pending, setPending] = useState<ExpenseListItem | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(0);
  const pageCount = expensePageCount(expenses.length);
  const currentPage = Math.min(page, pageCount - 1);
  const rows = expensePageItems(expenses, currentPage);

  useEffect(() => {
    setPage(0);
  }, [resetKey]);

  useEffect(() => {
    setPage(current => Math.min(current, pageCount - 1));
  }, [pageCount]);

  const close = () => {
    if (busy) return;
    setPending(null);
    setError(null);
  };

  const confirmRemove = async () => {
    if (!pending || busy) return;
    setBusy(true);
    setError(null);
    try {
      const result = await onRemove(pending);
      if (!result.ok) {
        setError(result.error || 'Could not remove this expense.');
        setBusy(false);
        return;
      }
      setBusy(false);
      setPending(null);
    } catch {
      setError('Could not remove this expense.');
      setBusy(false);
    }
  };

  return (
    <>
      <div className="hidden overflow-x-auto rounded-lg border border-white/10 bg-white/[0.02] md:block">
        <table className="min-w-full">
          <thead>
            <tr className="border-b border-white/10">
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-400">
                Expense
              </th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-400">
                Category
              </th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-400">
                Date
              </th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-400">
                Amount
              </th>
              <th className="px-4 py-3 text-right text-xs font-semibold text-gray-400">
                <span className="sr-only">Actions</span>
              </th>
            </tr>
          </thead>
          <tbody>
            {rows.map(expense => (
              <tr
                key={expense.id}
                tabIndex={canWrite ? 0 : undefined}
                role={canWrite ? 'button' : undefined}
                aria-label={
                  canWrite ? `Edit expense ${expense.name}` : undefined
                }
                onClick={() => {
                  if (canWrite) onEdit(expense);
                }}
                onKeyDown={event => {
                  if (!canWrite) return;
                  if (event.key === 'Enter' || event.key === ' ') {
                    event.preventDefault();
                    onEdit(expense);
                  }
                }}
                className={`border-b border-white/5 last:border-0 ${
                  canWrite
                    ? 'cursor-pointer transition-colors hover:bg-white/[0.03] focus-visible:bg-white/[0.04] focus-visible:outline-none'
                    : ''
                }`}
              >
                <td className="max-w-[16rem] px-4 py-3.5 align-middle">
                  <span className="block truncate text-sm font-semibold text-white">
                    {expense.name}
                  </span>
                </td>
                <td className="px-4 py-3.5 align-middle text-sm text-gray-300">
                  {expenseCategoryLabel(expense.category)}
                </td>
                <td className="px-4 py-3.5 align-middle text-sm text-gray-300">
                  {formatExpenseDate(expense.chargedOn)}
                </td>
                <td className="px-4 py-3.5 align-middle text-sm font-medium tabular-nums text-white">
                  {formatExpenseCents(expense.amountCents)}
                </td>
                <td className="px-4 py-3.5 text-right align-middle">
                  {canWrite ? (
                    <IconButton
                      variant="ghost"
                      size="sm"
                      aria-label={`Remove expense ${expense.name}`}
                      title="Remove"
                      icon={<TrashIcon className="h-4 w-4" />}
                      onClick={event => {
                        event.stopPropagation();
                        setError(null);
                        setPending(expense);
                      }}
                    />
                  ) : null}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <ul className="flex list-none flex-col gap-3 md:hidden">
        {rows.map(expense => (
          <li key={expense.id}>
            <div className="rounded-lg border border-white/10 bg-white/[0.02] p-4">
              <div className="flex items-start justify-between gap-3">
                <button
                  type="button"
                  className="min-w-0 flex-1 cursor-pointer text-left disabled:cursor-default"
                  disabled={!canWrite}
                  onClick={() => onEdit(expense)}
                >
                  <p className="truncate text-base font-semibold text-white">
                    {expense.name}
                  </p>
                  <p className="mt-1 text-sm text-gray-400">
                    {expenseCategoryLabel(expense.category)} ·{' '}
                    {formatExpenseDate(expense.chargedOn)}
                  </p>
                </button>
                <p className="shrink-0 text-sm font-medium tabular-nums text-white">
                  {formatExpenseCents(expense.amountCents)}
                </p>
              </div>
              {canWrite ? (
                <div className="mt-3 flex justify-end">
                  <Button
                    type="button"
                    variant="ghost"
                    size="xs"
                    onClick={() => {
                      setError(null);
                      setPending(expense);
                    }}
                  >
                    Remove
                  </Button>
                </div>
              ) : null}
            </div>
          </li>
        ))}
      </ul>

      <ListPagination
        page={currentPage}
        pageCount={pageCount}
        onPageChange={setPage}
      />

      <Modal
        isOpen={pending !== null}
        onClose={close}
        title="Remove expense"
        maxWidth="sm"
        preventClose={busy}
      >
        <p className="mb-6 text-sm text-gray-300">
          {pending
            ? `${pending.name} (${formatExpenseCents(pending.amountCents)}) will be removed from your expenses.`
            : null}
        </p>
        {error ? (
          <p className="mb-4 text-sm text-red-200" role="alert">
            {error}
          </p>
        ) : null}
        <div className="grid grid-cols-2 gap-3">
          <Button
            type="button"
            variant="secondary"
            disabled={busy}
            onClick={close}
            className="w-full"
          >
            Cancel
          </Button>
          <Button
            type="button"
            variant="danger"
            loading={busy}
            disabled={busy}
            onClick={() => void confirmRemove()}
            className="w-full"
          >
            Remove
          </Button>
        </div>
      </Modal>
    </>
  );
};
