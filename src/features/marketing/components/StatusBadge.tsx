'use client';

import React from 'react';
import type { PromoCodeStatus, SaleStatus } from '../types';

interface StatusBadgeProps {
  status: PromoCodeStatus | SaleStatus;
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({ status }) => {
  const config = {
    active: {
      label: 'Active',
      className:
        'bg-emerald-500/12 text-emerald-300 border border-emerald-400/35',
    },
    scheduled: {
      label: 'Scheduled',
      className: 'bg-blue-500/12 text-blue-300 border border-blue-400/35',
    },
    expired: {
      label: 'Expired',
      className: 'bg-gray-500/12 text-gray-400 border border-gray-500/35',
    },
    inactive: {
      label: 'Inactive',
      className: 'bg-gray-500/12 text-gray-400 border border-gray-500/35',
    },
  };

  const { label, className } = config[status];

  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold uppercase tracking-wide ${className}`}
    >
      {label}
    </span>
  );
};
