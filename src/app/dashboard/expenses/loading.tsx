import { ExpensesDashboardSkeleton } from '@/features/expenses/components/ExpensesDashboardSkeleton';

export default function ExpensesLoading() {
  return (
    <div className="flex h-full flex-col">
      <div className="flex-1 overflow-y-auto">
        <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
          <ExpensesDashboardSkeleton />
        </div>
      </div>
    </div>
  );
}
