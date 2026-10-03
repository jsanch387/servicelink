import { mapExpenseRow } from '@/features/expenses/server/mapExpenseRow';
import { insertExpense } from '@/features/expenses/server/mutateExpense';
import { parseExpenseBody } from '@/features/expenses/utils/parseExpense';
import { requireBusinessPermission } from '@/features/team/server/requireBusinessPermission';
import { getAuthenticatedUser } from '@/libs/api/getAuthenticatedUser';
import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  try {
    const auth = await getAuthenticatedUser(request);
    if ('error' in auth) {
      return NextResponse.json(
        { success: false, error: auth.error },
        { status: auth.status }
      );
    }

    const resolved = await requireBusinessPermission(
      auth.supabase,
      'expenses.read'
    );
    if (!resolved.ok) {
      return NextResponse.json(
        { success: false, error: resolved.error },
        { status: resolved.status }
      );
    }

    const { data, error } = await auth.supabase
      .from('business_expenses')
      .select('id, name, amount_cents, category, charged_on')
      .eq('business_id', resolved.businessId)
      .order('charged_on', { ascending: false })
      .order('created_at', { ascending: false });

    if (error) {
      console.error('expenses GET:', error);
      return NextResponse.json(
        { success: false, error: 'Could not load expenses.' },
        { status: 500 }
      );
    }

    const expenses = (Array.isArray(data) ? data : [])
      .map(row => mapExpenseRow(row))
      .filter(row => row !== null);

    return NextResponse.json({ success: true, expenses });
  } catch (error) {
    console.error('expenses GET:', error);
    return NextResponse.json(
      { success: false, error: 'Could not load expenses.' },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
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

    const saved = await insertExpense(auth.supabase, {
      businessId: resolved.businessId,
      createdByUserId: resolved.context.userId,
      expense: parsed.data,
    });

    if (!saved.ok) {
      return NextResponse.json(
        { success: false, error: saved.error },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true, expenseId: saved.id });
  } catch (error) {
    console.error('expenses POST:', error);
    return NextResponse.json(
      { success: false, error: 'Could not save this expense.' },
      { status: 500 }
    );
  }
}
