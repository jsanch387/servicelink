'use client';

import { API_ROUTES } from '@/constants/routes';
import { useCallback, useEffect, useState } from 'react';

import type { ExpenseFormValues, ExpenseListItem } from '../types';

type LoadStatus = 'loading' | 'ready' | 'error';

type ExpensesListResponse = {
  success?: boolean;
  error?: string;
  expenses?: ExpenseListItem[];
};

type MutationResult = { ok: true } | { ok: false; error: string };

async function mutationResult(
  response: Response,
  fallback: string
): Promise<MutationResult> {
  const json = (await response.json().catch(() => null)) as {
    success?: boolean;
    error?: string;
  } | null;

  if (!response.ok || !json?.success) {
    return { ok: false, error: json?.error || fallback };
  }

  return { ok: true };
}

export function useDashboardExpenses() {
  const [expenses, setExpenses] = useState<ExpenseListItem[]>([]);
  const [loadStatus, setLoadStatus] = useState<LoadStatus>('loading');
  const [loadError, setLoadError] = useState<string | null>(null);

  const reloadExpenses = useCallback(async (options?: { silent?: boolean }) => {
    if (!options?.silent) {
      setLoadStatus('loading');
      setLoadError(null);
    }
    try {
      const response = await fetch(API_ROUTES.EXPENSES);
      const json = (await response
        .json()
        .catch(() => null)) as ExpensesListResponse | null;

      if (!response.ok || !json?.success) {
        throw new Error(json?.error || 'Could not load expenses.');
      }

      setExpenses(Array.isArray(json.expenses) ? json.expenses : []);
      setLoadStatus('ready');
    } catch (error) {
      const message =
        error instanceof Error ? error.message : 'Could not load expenses.';
      setLoadError(message);
      setLoadStatus('error');
    }
  }, []);

  useEffect(() => {
    void reloadExpenses();
  }, [reloadExpenses]);

  const saveExpense = useCallback(
    async (
      values: ExpenseFormValues,
      expenseId?: string
    ): Promise<MutationResult> => {
      let response: Response;
      try {
        response = await fetch(
          expenseId ? API_ROUTES.EXPENSE(expenseId) : API_ROUTES.EXPENSES,
          {
            method: expenseId ? 'PATCH' : 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(values),
          }
        );
      } catch {
        return { ok: false, error: 'Could not save this expense.' };
      }

      const result = await mutationResult(
        response,
        'Could not save this expense.'
      );
      if (!result.ok) return result;

      await reloadExpenses({ silent: true });
      return { ok: true };
    },
    [reloadExpenses]
  );

  const removeExpense = useCallback(
    async (expenseId: string): Promise<MutationResult> => {
      let response: Response;
      try {
        response = await fetch(API_ROUTES.EXPENSE(expenseId), {
          method: 'DELETE',
        });
      } catch {
        return { ok: false, error: 'Could not remove this expense.' };
      }

      const result = await mutationResult(
        response,
        'Could not remove this expense.'
      );
      if (!result.ok) return result;

      await reloadExpenses({ silent: true });
      return { ok: true };
    },
    [reloadExpenses]
  );

  return {
    expenses,
    loadStatus,
    loadError,
    reloadExpenses,
    saveExpense,
    removeExpense,
  };
}
