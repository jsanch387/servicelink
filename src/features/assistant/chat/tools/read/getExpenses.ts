import { businessCanUseExpenses } from '@/features/expenses/server/requireExpensePro';
import { mapExpenseRow } from '@/features/expenses/server/mapExpenseRow';
import type { ExpenseListItem } from '@/features/expenses/types';
import { formatPaymentDollars } from '@/features/payments/utils/formatPaymentMoney';
import { createSupabaseAdminClient } from '@/libs/supabase/admin';

import {
  CHAT_PERIODS,
  resolveChatPeriodRange,
  type ChatPeriod,
} from './chatPeriodRange';

export const GET_EXPENSE_PERIODS = CHAT_PERIODS;
export type GetExpensePeriod = ChatPeriod;

export type GetExpensesResult =
  | {
      ok: true;
      period: GetExpensePeriod;
      fromYmd: string | null;
      toYmd: string | null;
      totalCents: number;
      totalLabel: string;
      expenseCount: number;
      byCategory: Array<{
        category: string;
        totalCents: number;
        totalLabel: string;
        count: number;
      }>;
    }
  | { ok: false; error: string };

export async function executeGetExpenses(args: {
  businessId: string;
  period: GetExpensePeriod;
  now?: Date;
}): Promise<GetExpensesResult> {
  const allowed = await businessCanUseExpenses(args.businessId);
  if (!allowed) {
    return {
      ok: false,
      error: 'Expenses are a Pro feature. Upgrade to Pro to track expenses.',
    };
  }

  const range = resolveChatPeriodRange({
    period: args.period,
    now: args.now,
  });

  try {
    const admin = createSupabaseAdminClient();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data, error } = await (admin as any)
      .from('business_expenses')
      .select('id, name, amount_cents, category, charged_on')
      .eq('business_id', args.businessId)
      .order('charged_on', { ascending: false })
      .limit(500);

    if (error) {
      console.error('[assistant:chat] getExpenses', error);
      return { ok: false, error: 'Could not load expenses right now.' };
    }

    const expenses = ((data ?? []) as unknown[])
      .map(mapExpenseRow)
      .filter((row): row is ExpenseListItem => row != null)
      .filter(expense => {
        if (range.unbounded) return true;
        return (
          expense.chargedOn >= range.fromYmd && expense.chargedOn <= range.toYmd
        );
      });

    let totalCents = 0;
    const byCategoryMap = new Map<
      string,
      { totalCents: number; count: number }
    >();

    for (const expense of expenses) {
      totalCents += expense.amountCents;
      const current = byCategoryMap.get(expense.category) ?? {
        totalCents: 0,
        count: 0,
      };
      current.totalCents += expense.amountCents;
      current.count += 1;
      byCategoryMap.set(expense.category, current);
    }

    const byCategory = [...byCategoryMap.entries()]
      .map(([category, stats]) => ({
        category,
        totalCents: stats.totalCents,
        totalLabel: formatPaymentDollars(stats.totalCents),
        count: stats.count,
      }))
      .sort((a, b) => b.totalCents - a.totalCents)
      .slice(0, 8);

    return {
      ok: true,
      period: args.period,
      fromYmd: range.unbounded ? null : range.fromYmd,
      toYmd: range.unbounded ? null : range.toYmd,
      totalCents,
      totalLabel: formatPaymentDollars(totalCents),
      expenseCount: expenses.length,
      byCategory,
    };
  } catch (error) {
    console.error('[assistant:chat] getExpenses', error);
    return { ok: false, error: 'Could not load expenses right now.' };
  }
}
