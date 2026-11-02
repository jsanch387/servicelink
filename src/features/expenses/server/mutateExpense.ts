import type { Database } from '@/libs/supabase/client';
import type { SupabaseClient } from '@supabase/supabase-js';

import type { ParsedExpense } from '../utils/parseExpense';

type ExpenseClient = SupabaseClient<Database>;

export async function insertExpense(
  supabase: ExpenseClient,
  input: {
    businessId: string;
    createdByUserId: string;
    expense: ParsedExpense;
  }
): Promise<{ ok: true; id: string } | { ok: false; error: string }> {
  const { data, error } = await supabase
    .from('business_expenses')
    .insert({
      business_id: input.businessId,
      created_by: input.createdByUserId,
      name: input.expense.name,
      amount_cents: input.expense.amountCents,
      category: input.expense.category,
      charged_on: input.expense.chargedOn,
    } as never)
    .select('id')
    .single();

  const row = data as { id?: string } | null;
  if (error || !row?.id) {
    console.error('insertExpense:', error);
    return { ok: false, error: 'Could not save this expense.' };
  }

  return { ok: true, id: row.id };
}

export async function updateExpense(
  supabase: ExpenseClient,
  input: {
    businessId: string;
    expenseId: string;
    expense: ParsedExpense;
  }
): Promise<{ ok: true } | { ok: false; error: string; status: number }> {
  const { data, error } = await supabase
    .from('business_expenses')
    .update({
      name: input.expense.name,
      amount_cents: input.expense.amountCents,
      category: input.expense.category,
      charged_on: input.expense.chargedOn,
    } as never)
    .eq('id', input.expenseId)
    .eq('business_id', input.businessId)
    .select('id');

  if (error) {
    console.error('updateExpense:', error);
    return { ok: false, error: 'Could not save this expense.', status: 500 };
  }

  if (!data?.length) {
    return { ok: false, error: 'Expense not found.', status: 404 };
  }

  return { ok: true };
}

export async function deleteExpense(
  supabase: ExpenseClient,
  input: { businessId: string; expenseId: string }
): Promise<{ ok: true } | { ok: false; error: string; status: number }> {
  const { data, error } = await supabase
    .from('business_expenses')
    .delete()
    .eq('id', input.expenseId)
    .eq('business_id', input.businessId)
    .select('id');

  if (error) {
    console.error('deleteExpense:', error);
    return { ok: false, error: 'Could not remove this expense.', status: 500 };
  }

  if (!data?.length) {
    return { ok: false, error: 'Expense not found.', status: 404 };
  }

  return { ok: true };
}
