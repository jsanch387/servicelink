import { listPageCount, listPageItems } from '@/components/shared/listPage';

import type { ExpenseCategory } from '../constants';
import type { ExpenseListItem } from '../types';

export type ExpenseListFilters = {
  category: 'all' | ExpenseCategory;
  /** `YYYY-MM`, or null for every month. */
  month: string | null;
};

export function filterExpenses(
  expenses: readonly ExpenseListItem[],
  filters: ExpenseListFilters
): ExpenseListItem[] {
  return expenses.filter(expense => {
    if (filters.category !== 'all' && expense.category !== filters.category) {
      return false;
    }
    if (filters.month && expense.chargedOn.slice(0, 7) !== filters.month) {
      return false;
    }
    return true;
  });
}

export function expensePeriodTotals(
  expenses: readonly ExpenseListItem[],
  today: string
): { monthCents: number; yearCents: number } {
  const monthPrefix = today.slice(0, 7);
  const yearPrefix = today.slice(0, 4);
  let monthCents = 0;
  let yearCents = 0;

  for (const expense of expenses) {
    if (expense.chargedOn.startsWith(yearPrefix)) {
      yearCents += expense.amountCents;
    }
    if (expense.chargedOn.startsWith(monthPrefix)) {
      monthCents += expense.amountCents;
    }
  }

  return { monthCents, yearCents };
}

export const EXPENSE_PAGE_SIZE = 10;

export function expensePageCount(
  total: number,
  pageSize = EXPENSE_PAGE_SIZE
): number {
  return listPageCount(total, pageSize);
}

export function expensePageItems<T>(
  items: readonly T[],
  page: number,
  pageSize = EXPENSE_PAGE_SIZE
): T[] {
  return listPageItems(items, page, pageSize);
}
