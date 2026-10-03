export const EXPENSE_CATEGORIES = [
  { id: 'supplies', label: 'Supplies' },
  { id: 'fuel', label: 'Fuel' },
  { id: 'equipment', label: 'Equipment' },
  { id: 'insurance', label: 'Insurance' },
  { id: 'other', label: 'Other' },
] as const;

export type ExpenseCategory = (typeof EXPENSE_CATEGORIES)[number]['id'];

export const EXPENSE_CATEGORY_IDS: readonly ExpenseCategory[] =
  EXPENSE_CATEGORIES.map(category => category.id);

export function isExpenseCategory(value: string): value is ExpenseCategory {
  return (EXPENSE_CATEGORY_IDS as readonly string[]).includes(value);
}

export function expenseCategoryLabel(category: string): string {
  return (
    EXPENSE_CATEGORIES.find(entry => entry.id === category)?.label ?? 'Other'
  );
}
