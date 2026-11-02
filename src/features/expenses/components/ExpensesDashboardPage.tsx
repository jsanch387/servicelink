'use client';

import { Button } from '@/components/shared';
import { useDashboardAccess } from '@/features/dashboard/context/DashboardAccessContext';
import { PlusIcon } from '@heroicons/react/24/outline';
import React, { useMemo, useState } from 'react';

import { expenseCategoryLabel } from '../constants';
import { useDashboardExpenses } from '../hooks/useDashboardExpenses';
import type { ExpenseListItem } from '../types';
import {
  expensePeriodTotals,
  filterExpenses,
  type ExpenseListFilters,
} from '../utils/expenseTotals';
import { formatExpenseMonth, todayIsoDate } from '../utils/parseExpense';
import { ExpenseFormModal } from './ExpenseFormModal';
import { ExpensesEmptyState } from './ExpensesEmptyState';
import { ExpensesListSkeleton } from './ExpensesDashboardSkeleton';
import { ExpensesFilters } from './ExpensesFilters';
import { ExpensesList } from './ExpensesList';
import { ExpensesSummary } from './ExpensesSummary';

const OPEN_FILTERS: ExpenseListFilters = { category: 'all', month: null };

export const ExpensesDashboardPage: React.FC = () => {
  const canWrite = useDashboardAccess().can('expenses.write');
  const {
    expenses,
    loadStatus,
    loadError,
    reloadExpenses,
    saveExpense,
    removeExpense,
  } = useDashboardExpenses();
  const [filters, setFilters] = useState<ExpenseListFilters>(OPEN_FILTERS);
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<ExpenseListItem | null>(null);
  const today = useMemo(() => todayIsoDate(), []);
  const filtersActive = filters.category !== 'all' || Boolean(filters.month);

  const visible = useMemo(
    () => filterExpenses(expenses, filters),
    [expenses, filters]
  );
  const totals = useMemo(() => {
    const inCategory = filterExpenses(expenses, {
      category: filters.category,
      month: null,
    });
    const anchor = filters.month ? `${filters.month}-01` : today;
    return expensePeriodTotals(inCategory, anchor);
  }, [expenses, filters.category, filters.month, today]);
  const monthLabel = filters.month
    ? formatExpenseMonth(filters.month)
    : 'This month';
  const selectedYear = (filters.month ?? today).slice(0, 4);
  const yearLabel =
    selectedYear === today.slice(0, 4) ? 'This year' : selectedYear;

  const openCreate = () => {
    setEditing(null);
    setFormOpen(true);
  };

  const list = (() => {
    if (loadStatus === 'loading') {
      return (
        <div role="status" aria-label="Loading expenses">
          <span className="sr-only">Loading expenses</span>
          <ExpensesListSkeleton />
        </div>
      );
    }

    if (loadStatus === 'error') {
      return (
        <div className="rounded-2xl border border-red-400/20 bg-red-400/10 p-4 sm:p-5">
          <p className="text-sm text-red-200">
            {loadError || 'Could not load expenses.'}
          </p>
          <Button
            variant="secondary"
            size="sm"
            onClick={() => void reloadExpenses()}
            className="mt-3"
          >
            Try again
          </Button>
        </div>
      );
    }

    if (visible.length === 0) {
      const categoryName =
        filters.category === 'all'
          ? null
          : expenseCategoryLabel(filters.category).toLowerCase();
      const title = filters.month
        ? categoryName
          ? `No ${categoryName} expenses in ${monthLabel}`
          : `No expenses in ${monthLabel}`
        : categoryName
          ? `No ${categoryName} expenses`
          : 'No expenses yet';
      return (
        <ExpensesEmptyState
          title={title}
          description={
            filtersActive
              ? 'Try another month or category.'
              : 'Add supplies, fuel, and other costs so you can see what the shop spends.'
          }
          canCreate={canWrite && !filtersActive}
          onAdd={openCreate}
        />
      );
    }

    return (
      <ExpensesList
        expenses={visible}
        canWrite={canWrite}
        resetKey={`${filters.category}:${filters.month ?? ''}`}
        onEdit={expense => {
          setEditing(expense);
          setFormOpen(true);
        }}
        onRemove={expense => removeExpense(expense.id)}
      />
    );
  })();

  return (
    <div className="flex h-full flex-col">
      <div className="flex-1 overflow-y-auto">
        <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
          <header className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div className="min-w-0">
              <h1 className="text-3xl font-bold leading-none text-white">
                Expenses
              </h1>
              <p className="mt-1 text-gray-400">
                Add and track what the shop spends.
              </p>
            </div>
            {canWrite && loadStatus === 'ready' ? (
              <Button
                type="button"
                variant="inverse"
                size="sm"
                icon={<PlusIcon className="h-4 w-4" />}
                className="w-full shrink-0 sm:w-auto"
                onClick={openCreate}
              >
                Add expense
              </Button>
            ) : null}
          </header>

          {loadStatus === 'ready' ? (
            <>
              <ExpensesSummary
                monthCents={totals.monthCents}
                yearCents={totals.yearCents}
                monthLabel={monthLabel}
                yearLabel={yearLabel}
              />
              {expenses.length > 0 || filtersActive ? (
                <ExpensesFilters filters={filters} onChange={setFilters} />
              ) : null}
            </>
          ) : null}

          {list}
        </div>
      </div>

      <ExpenseFormModal
        open={formOpen}
        expense={editing}
        defaultDate={today}
        onClose={() => setFormOpen(false)}
        onSubmit={async values => {
          const result = await saveExpense(values, editing?.id);
          return result.ok ? { ok: true } : { ok: false, error: result.error };
        }}
      />
    </div>
  );
};
