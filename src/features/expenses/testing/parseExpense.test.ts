import { describe, expect, it } from 'vitest';

import type { ExpenseListItem } from '../types';
import {
  expensePageCount,
  expensePageItems,
  expensePeriodTotals,
  filterExpenses,
} from '../utils/expenseTotals';
import { parseExpenseBody } from '../utils/parseExpense';

const TODAY = '2026-10-02';

describe('parseExpenseBody', () => {
  it('accepts a shop expense', () => {
    const result = parseExpenseBody(
      {
        name: '  Shell  ',
        amount: '42.50',
        category: 'fuel',
        chargedOn: '2026-10-01',
      },
      TODAY
    );

    expect(result).toEqual({
      ok: true,
      data: {
        name: 'Shell',
        amountCents: 4250,
        category: 'fuel',
        chargedOn: '2026-10-01',
      },
    });
  });

  it('rejects a blank name, a zero amount, and an unknown category', () => {
    expect(
      parseExpenseBody(
        { name: '  ', amount: '10', category: 'fuel', chargedOn: TODAY },
        TODAY
      )
    ).toEqual({ ok: false, error: 'Enter a name.' });

    expect(
      parseExpenseBody(
        { name: 'Shell', amount: '0', category: 'fuel', chargedOn: TODAY },
        TODAY
      )
    ).toEqual({ ok: false, error: 'Enter an amount greater than $0.' });

    expect(
      parseExpenseBody(
        {
          name: 'Shell',
          amount: '10',
          category: 'payroll',
          chargedOn: TODAY,
        },
        TODAY
      )
    ).toEqual({ ok: false, error: 'Choose a category.' });
  });

  it('rejects a name longer than 40 characters', () => {
    expect(
      parseExpenseBody(
        {
          name: 'A'.repeat(41),
          amount: '10',
          category: 'other',
          chargedOn: TODAY,
        },
        TODAY
      )
    ).toEqual({ ok: false, error: 'Keep the name to 40 characters.' });
  });

  it('rejects a date that is not a real calendar day', () => {
    expect(
      parseExpenseBody(
        {
          name: 'Shell',
          amount: '10',
          category: 'fuel',
          chargedOn: '2026-02-31',
        },
        TODAY
      ).ok
    ).toBe(false);
  });
});

describe('expensePeriodTotals', () => {
  it('sums the current month and year from the charged-on date', () => {
    const expenses: ExpenseListItem[] = [
      {
        id: '1',
        name: 'Shell',
        amountCents: 1000,
        category: 'fuel',
        chargedOn: '2026-10-01',
      },
      {
        id: '2',
        name: 'Insurance',
        amountCents: 5000,
        category: 'insurance',
        chargedOn: '2026-03-01',
      },
      {
        id: '3',
        name: 'Old',
        amountCents: 9000,
        category: 'other',
        chargedOn: '2025-12-01',
      },
    ];

    expect(expensePeriodTotals(expenses, TODAY)).toEqual({
      monthCents: 1000,
      yearCents: 6000,
    });
  });

  it('keeps one month, such as September, and one category', () => {
    const expenses: ExpenseListItem[] = [
      {
        id: '1',
        name: 'Shell',
        amountCents: 1000,
        category: 'fuel',
        chargedOn: '2026-09-02',
      },
      {
        id: '2',
        name: 'Towels',
        amountCents: 500,
        category: 'supplies',
        chargedOn: '2026-09-18',
      },
      {
        id: '3',
        name: 'October fuel',
        amountCents: 800,
        category: 'fuel',
        chargedOn: '2026-10-01',
      },
    ];

    expect(
      filterExpenses(expenses, { category: 'all', month: '2026-09' }).map(
        expense => expense.id
      )
    ).toEqual(['1', '2']);
    expect(
      filterExpenses(expenses, { category: 'fuel', month: '2026-09' }).map(
        expense => expense.name
      )
    ).toEqual(['Shell']);
  });
});

describe('expense pages', () => {
  it('shows 10 expenses per page and keeps the rest for the next page', () => {
    const expenses = Array.from({ length: 12 }, (_, index) => index + 1);

    expect(expensePageCount(expenses.length)).toBe(2);
    expect(expensePageItems(expenses, 0)).toEqual([
      1, 2, 3, 4, 5, 6, 7, 8, 9, 10,
    ]);
    expect(expensePageItems(expenses, 1)).toEqual([11, 12]);
  });
});
