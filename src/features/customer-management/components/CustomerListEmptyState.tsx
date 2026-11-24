import type { CustomerLifecycle } from '@/features/customer-management/types';
import React from 'react';

interface CustomerListEmptyStateProps {
  statusFilter: 'all' | CustomerLifecycle | 'needs_attention';
}

export const CustomerListEmptyState: React.FC<CustomerListEmptyStateProps> = ({
  statusFilter,
}) => {
  const message =
    statusFilter === 'needs_attention'
      ? "Customers who haven't booked in 90 days will show up here."
      : 'No customers match your current filters.';

  return (
    <p className="px-2 py-16 text-center text-sm text-white/60">{message}</p>
  );
};
