import { InvoicesDashboardSkeleton } from '@/features/invoices/components/InvoicesDashboardSkeleton';

export default function InvoicesLoading() {
  return (
    <div className="flex h-full flex-col">
      <div className="flex-1 overflow-y-auto">
        <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
          <InvoicesDashboardSkeleton />
        </div>
      </div>
    </div>
  );
}
