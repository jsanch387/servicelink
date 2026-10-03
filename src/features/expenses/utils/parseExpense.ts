import { isExpenseCategory, type ExpenseCategory } from '../constants';

const NAME_MAX = 40;
const AMOUNT_CENTS_MAX = 100_000_000;

export type ParsedExpense = {
  name: string;
  amountCents: number;
  category: ExpenseCategory;
  chargedOn: string;
};

export type ParseExpenseResult =
  | { ok: true; data: ParsedExpense }
  | { ok: false; error: string };

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

/** Dollars string from MoneyInput → cents. Empty or zero is not an expense. */
export function parseExpenseAmountToCents(amount: string): number | null {
  const trimmed = amount.trim();
  if (!trimmed || trimmed === '.') return null;

  const value = Number(trimmed);
  if (!Number.isFinite(value) || value <= 0) return null;

  const cents = Math.round(value * 100);
  if (!Number.isInteger(cents) || cents < 1 || cents > AMOUNT_CENTS_MAX) {
    return null;
  }
  return cents;
}

/** Dollar string for MoneyInput. `2550` → `25.50`. */
export function centsToExpenseAmountInput(cents: number): string {
  if (!Number.isInteger(cents) || cents < 0) return '';
  const dollars = Math.floor(cents / 100);
  const remainder = cents % 100;
  if (remainder === 0) return String(dollars);
  return `${dollars}.${String(remainder).padStart(2, '0')}`;
}

export function formatExpenseCents(cents: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }).format(cents / 100);
}

/** Local calendar date as `YYYY-MM-DD`. */
export function todayIsoDate(now = new Date()): string {
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function isRealIsoDate(value: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const [year, month, day] = value.split('-').map(Number);
  const date = new Date(Date.UTC(year, month - 1, day));
  return (
    date.getUTCFullYear() === year &&
    date.getUTCMonth() === month - 1 &&
    date.getUTCDate() === day
  );
}

function addYears(isoDate: string, years: number): string {
  const [year, month, day] = isoDate.split('-').map(Number);
  return todayIsoDate(new Date(year + years, month - 1, day));
}

/** `2026-09` → `September 2026`. */
export function formatExpenseMonth(yearMonth: string): string {
  if (!/^\d{4}-\d{2}$/.test(yearMonth)) return yearMonth;
  const [year, month] = yearMonth.split('-').map(Number);
  const date = new Date(year, month - 1, 1);
  if (Number.isNaN(date.getTime()) || date.getMonth() !== month - 1) {
    return yearMonth;
  }
  return date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
}

export function formatExpenseDate(isoDate: string): string {
  const day = isoDate.slice(0, 10);
  if (!isRealIsoDate(day)) return isoDate;
  const date = new Date(`${day}T12:00:00`);
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

export function parseExpenseBody(
  body: unknown,
  today = todayIsoDate()
): ParseExpenseResult {
  if (!isRecord(body)) {
    return { ok: false, error: 'Enter the expense details.' };
  }

  if (typeof body.name !== 'string') {
    return { ok: false, error: 'Enter a name.' };
  }
  const name = body.name.trim();
  if (!name) return { ok: false, error: 'Enter a name.' };
  if (name.length > NAME_MAX) {
    return { ok: false, error: 'Keep the name to 40 characters.' };
  }

  if (typeof body.amount !== 'string') {
    return { ok: false, error: 'Enter an amount.' };
  }
  const amountCents = parseExpenseAmountToCents(body.amount);
  if (amountCents === null) {
    return { ok: false, error: 'Enter an amount greater than $0.' };
  }

  if (typeof body.category !== 'string' || !isExpenseCategory(body.category)) {
    return { ok: false, error: 'Choose a category.' };
  }

  if (typeof body.chargedOn !== 'string' || !isRealIsoDate(body.chargedOn)) {
    return { ok: false, error: 'Choose a valid date.' };
  }
  if (body.chargedOn < '2000-01-01' || body.chargedOn > addYears(today, 1)) {
    return { ok: false, error: 'Choose a date within the last few years.' };
  }

  return {
    ok: true,
    data: {
      name,
      amountCents,
      category: body.category,
      chargedOn: body.chargedOn,
    },
  };
}
