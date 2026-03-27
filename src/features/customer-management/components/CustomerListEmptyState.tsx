import { GlassCard } from '@/components/shared';
import type { CustomerLifecycle } from '@/features/customer-management/types';
import React from 'react';

interface CustomerListEmptyStateProps {
  statusFilter: 'all' | CustomerLifecycle | 'needs_attention';
}

export const CustomerListEmptyState: React.FC<CustomerListEmptyStateProps> = ({
  statusFilter,
}) => {
  if (statusFilter === 'needs_attention') {
    return (
      <GlassCard rounded="rounded-2xl" className="p-6 mt-3 text-center">
        <p className="text-sm text-gray-200 font-medium">
          No customers need attention yet.
        </p>
        <p className="text-xs text-gray-400 mt-2">
          We&apos;ll notify you here when a customer hasn&apos;t booked in 90
          days so you can send them a quick win-back link.
        </p>
      </GlassCard>
    );
  }

  return (
    <GlassCard rounded="rounded-2xl" className="p-6 mt-3 text-center">
      <p className="text-sm text-gray-300">
        No customers match your current filters.
      </p>
    </GlassCard>
  );
};
