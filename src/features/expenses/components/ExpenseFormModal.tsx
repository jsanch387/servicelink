'use client';

import {
  Button,
  DropdownSelect,
  Input,
  Modal,
  MoneyInput,
} from '@/components/shared';
import { CalendarDaysIcon } from '@heroicons/react/24/outline';
import React, { useEffect, useState } from 'react';

import { EXPENSE_CATEGORIES } from '../constants';
import type { ExpenseFormValues, ExpenseListItem } from '../types';
import { centsToExpenseAmountInput } from '../utils/parseExpense';

const EMPTY_FORM: ExpenseFormValues = {
  name: '',
  amount: '',
  category: 'supplies',
  chargedOn: '',
};

function formFromExpense(expense: ExpenseListItem): ExpenseFormValues {
  return {
    name: expense.name,
    amount: centsToExpenseAmountInput(expense.amountCents),
    category: expense.category,
    chargedOn: expense.chargedOn,
  };
}

export const ExpenseFormModal: React.FC<{
  open: boolean;
  expense: ExpenseListItem | null;
  defaultDate: string;
  onClose: () => void;
  onSubmit: (
    values: ExpenseFormValues
  ) => Promise<{ ok: boolean; error?: string }>;
}> = ({ open, expense, defaultDate, onClose, onSubmit }) => {
  const [values, setValues] = useState<ExpenseFormValues>(EMPTY_FORM);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const editing = expense !== null;

  useEffect(() => {
    if (!open) return;
    setValues(
      expense
        ? formFromExpense(expense)
        : { ...EMPTY_FORM, chargedOn: defaultDate }
    );
    setError(null);
    setBusy(false);
  }, [open, expense, defaultDate]);

  const close = () => {
    if (busy) return;
    onClose();
  };

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (busy) return;
    setBusy(true);
    setError(null);
    try {
      const result = await onSubmit(values);
      if (!result.ok) {
        setError(result.error || 'Could not save this expense.');
        setBusy(false);
        return;
      }
      setBusy(false);
      onClose();
    } catch {
      setError('Could not save this expense.');
      setBusy(false);
    }
  };

  return (
    <Modal
      isOpen={open}
      onClose={close}
      title={editing ? 'Edit expense' : 'Add expense'}
      maxWidth="md"
      preventClose={busy}
    >
      <form onSubmit={event => void submit(event)} className="space-y-4">
        <Input
          id="expense-name"
          label="Name"
          value={values.name}
          onChange={name => setValues(current => ({ ...current, name }))}
          placeholder="Gas, towels, insurance"
          required
          maxLength={40}
          autoComplete="off"
        />
        <MoneyInput
          label="Amount"
          value={values.amount}
          onChange={amount => setValues(current => ({ ...current, amount }))}
          required
          aria-label="Amount"
        />
        <DropdownSelect
          label="Category"
          value={values.category}
          onChange={category =>
            setValues(current => ({
              ...current,
              category: category as ExpenseFormValues['category'],
            }))
          }
          options={EXPENSE_CATEGORIES.map(category => ({
            value: category.id,
            label: category.label,
          }))}
          required
        />
        <div>
          <label
            htmlFor="expense-date"
            className="mb-1.5 block text-left text-sm font-medium text-gray-200"
          >
            Date
          </label>
          <div className="flex min-h-[42px] items-center rounded-lg border border-white/10 bg-white/5 px-3.5 transition-colors hover:border-white/20 focus-within:border-white/30 focus-within:ring-2 focus-within:ring-white/20">
            <CalendarDaysIcon
              className="mr-2.5 h-4 w-4 shrink-0 text-zinc-400"
              aria-hidden
            />
            <input
              id="expense-date"
              type="date"
              required
              value={values.chargedOn}
              onChange={event =>
                setValues(current => ({
                  ...current,
                  chargedOn: event.target.value,
                }))
              }
              className="min-h-[42px] w-full min-w-0 flex-1 cursor-pointer border-0 bg-transparent py-2.5 text-base text-white outline-none [color-scheme:dark] focus:ring-0 sm:text-sm [&::-webkit-calendar-picker-indicator]:cursor-pointer"
            />
          </div>
        </div>
        {error ? (
          <p className="text-sm text-red-200" role="alert">
            {error}
          </p>
        ) : null}
        <div className="grid grid-cols-2 gap-3 pt-1">
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
            type="submit"
            variant="primary"
            loading={busy}
            disabled={busy}
            className="w-full"
          >
            {editing ? 'Save' : 'Add expense'}
          </Button>
        </div>
      </form>
    </Modal>
  );
};
