import { isExpenseCategory } from '../constants';
import type { ExpenseListItem } from '../types';
import { isRealIsoDate } from '../utils/parseExpense';

export function mapExpenseRow(row: unknown): ExpenseListItem | null {
  if (!row || typeof row !== 'object') return null;
  const record = row as Record<string, unknown>;
  const id = typeof record.id === 'string' ? record.id : '';
  const name = typeof record.name === 'string' ? record.name.trim() : '';
  const category = typeof record.category === 'string' ? record.category : '';
  const chargedOn =
    typeof record.charged_on === 'string' ? record.charged_on : '';
  const amountCents = record.amount_cents;

  if (
    !id ||
    !name ||
    !isExpenseCategory(category) ||
    !isRealIsoDate(chargedOn)
  ) {
    return null;
  }
  if (
    typeof amountCents !== 'number' ||
    !Number.isInteger(amountCents) ||
    amountCents < 1
  ) {
    return null;
  }

  return {
    id,
    name,
    amountCents,
    category,
    chargedOn: chargedOn.slice(0, 10),
  };
}
