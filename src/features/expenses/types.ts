import type { ExpenseCategory } from './constants';

export type ExpenseListItem = {
  id: string;
  name: string;
  amountCents: number;
  category: ExpenseCategory;
  chargedOn: string;
};

export type ExpenseFormValues = {
  name: string;
  amount: string;
  category: ExpenseCategory;
  chargedOn: string;
};
