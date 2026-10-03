import {
  deleteExpense,
  updateExpense,
} from '@/features/expenses/server/mutateExpense';
import { parseExpenseBody } from '@/features/expenses/utils/parseExpense';
import { requireBusinessPermission } from '@/features/team/server/requireBusinessPermission';
import { getAuthenticatedUser } from '@/libs/api/getAuthenticatedUser';
import { NextResponse } from 'next/server';

const EXPENSE_ID =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

interface RouteContext {
  params: Promise<{ expenseId: string }>;
}

async function readExpenseId(context: RouteContext): Promise<string | null> {
  const { expenseId } = await context.params;
  const id = expenseId?.trim() ?? '';
  return EXPENSE_ID.test(id) ? id : null;
}

export async function PATCH(request: Request, context: RouteContext) {
  try {
    const expenseId = await readExpenseId(context);
    if (!expenseId) {
      return NextResponse.json(
        { success: false, error: 'Expense not found.' },
        { status: 404 }
      );
    }

    const auth = await getAuthenticatedUser(request);
    if ('error' in auth) {
      return NextResponse.json(
        { success: false, error: auth.error },
        { status: auth.status }
      );
    }

    const resolved = await requireBusinessPermission(
      auth.supabase,
      'expenses.write'
    );
    if (!resolved.ok) {
      return NextResponse.json(
        { success: false, error: resolved.error },
        { status: resolved.status }
      );
    }

    const json: unknown = await request.json().catch(() => null);
    const parsed = parseExpenseBody(json);
    if (!parsed.ok) {
      return NextResponse.json(
        { success: false, error: parsed.error },
        { status: 400 }
      );
    }

    const saved = await updateExpense(auth.supabase, {
      businessId: resolved.businessId,
      expenseId,
      expense: parsed.data,
    });

    if (!saved.ok) {
      return NextResponse.json(
        { success: false, error: saved.error },
        { status: saved.status }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('expenses PATCH:', error);
    return NextResponse.json(
      { success: false, error: 'Could not save this expense.' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: Request, context: RouteContext) {
  try {
    const expenseId = await readExpenseId(context);
    if (!expenseId) {
      return NextResponse.json(
        { success: false, error: 'Expense not found.' },
        { status: 404 }
      );
    }

    const auth = await getAuthenticatedUser(request);
    if ('error' in auth) {
      return NextResponse.json(
        { success: false, error: auth.error },
        { status: auth.status }
      );
    }

    const resolved = await requireBusinessPermission(
      auth.supabase,
      'expenses.write'
    );
    if (!resolved.ok) {
      return NextResponse.json(
        { success: false, error: resolved.error },
        { status: resolved.status }
      );
    }

    const removed = await deleteExpense(auth.supabase, {
      businessId: resolved.businessId,
      expenseId,
    });

    if (!removed.ok) {
      return NextResponse.json(
        { success: false, error: removed.error },
        { status: removed.status }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('expenses DELETE:', error);
    return NextResponse.json(
      { success: false, error: 'Could not remove this expense.' },
      { status: 500 }
    );
  }
}
