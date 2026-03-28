import type { CustomerLifecycle } from '@/features/customer-management/types';
import React from 'react';

interface CustomerStatusBadgeProps {
  status: CustomerLifecycle;
  needsAttention?: boolean;
}

const STATUS_STYLES: Record<CustomerLifecycle, string> = {
  new: 'bg-sky-500/15 text-sky-300 border-sky-500/30',
  returning: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30',
};

const STATUS_LABELS: Record<CustomerLifecycle, string> = {
  new: 'New',
  returning: 'Returning',
};

export const CustomerStatusBadge: React.FC<CustomerStatusBadgeProps> = ({
  status,
  needsAttention = false,
}) => {
  if (needsAttention) {
    return (
      <span className="inline-flex items-center rounded-lg border border-amber-500/35 bg-amber-500/12 px-2.5 py-1 text-xs font-medium text-amber-300">
        Due
      </span>
    );
  }

  return (
    <span
      className={`inline-flex items-center rounded-lg border px-2.5 py-1 text-xs font-medium ${STATUS_STYLES[status]}`}
    >
      {STATUS_LABELS[status]}
    </span>
  );
};
