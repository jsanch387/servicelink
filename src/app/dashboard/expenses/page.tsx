import { ExpensesDashboardPage } from '@/features/expenses';
import { requireDashboardPageAccess } from '@/features/team/server/requireDashboardPageAccess';

export const dynamic = 'force-dynamic';

export default async function DashboardExpensesPage() {
  await requireDashboardPageAccess('expenses.read');
  return <ExpensesDashboardPage />;
}
