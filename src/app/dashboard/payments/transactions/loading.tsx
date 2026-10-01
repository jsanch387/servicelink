import { PaymentsPageHeader } from '@/features/payments/components/PaymentsPageHeader';
import { PaymentsTransactionsTableSkeleton } from '@/features/payments/components/PaymentsTransactionsTable';

export default function DashboardPaymentsTransactionsLoading() {
  return (
    <main className="flex-1 py-8 sm:py-10 px-4 sm:px-6 lg:px-8 overflow-x-hidden overflow-y-auto bg-[var(--dashboard-bg)] min-h-screen w-full">
      <div className="mx-auto w-full min-w-0 max-w-5xl">
        <PaymentsPageHeader />
        <PaymentsTransactionsTableSkeleton />
      </div>
    </main>
  );
}
