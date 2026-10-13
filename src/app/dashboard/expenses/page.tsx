import { ExpensesDashboardPage } from '@/features/expenses';
import { ExpensesNotProGate } from '@/features/expenses/components/ExpensesNotProGate';
import { businessCanUseExpenses } from '@/features/expenses/server/requireExpensePro';
import { requireDashboardPageAccess } from '@/features/team/server/requireDashboardPageAccess';

export const dynamic = 'force-dynamic';

export default async function DashboardExpensesPage() {
  const { context } = await requireDashboardPageAccess('expenses.read');
  const canUseExpenses = await businessCanUseExpenses(context.businessId);
  if (!canUseExpenses) return <ExpensesNotProGate />;

  return <ExpensesDashboardPage />;
}
