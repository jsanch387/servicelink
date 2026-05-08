import type { CustomerListStats } from '@/features/customer-management/types';
import {
  formatCustomerCount,
  formatCustomerCurrency,
} from '@/features/customer-management/utils/customerFormatting';
import React from 'react';

interface CustomerStatsRowProps {
  stats: CustomerListStats;
}

export const CustomerStatsRow: React.FC<CustomerStatsRowProps> = ({
  stats,
}) => {
  return (
    <div className="mb-4 sm:mb-6 border-t border-white/10 pt-3.5 sm:pt-5">
      <div className="flex flex-wrap items-center gap-x-2.5 sm:gap-x-3 gap-y-1.5 sm:gap-y-2 text-xs">
        <div
          className="inline-flex items-baseline gap-2 whitespace-nowrap"
          title={`${stats.totalCustomers} total customers`}
        >
          <span className="text-gray-500">Customers</span>
          <span className="text-sm font-semibold text-white tabular-nums">
            {formatCustomerCount(stats.totalCustomers)}
          </span>
        </div>
        <span className="h-3 w-px bg-white/15" aria-hidden />
        <div
          className="inline-flex items-baseline gap-2 whitespace-nowrap"
          title={`${stats.returningCustomers} returning customers`}
        >
          <span className="text-gray-500">Returning</span>
          <span className="text-sm font-semibold text-white tabular-nums">
            {formatCustomerCount(stats.returningCustomers)}
          </span>
        </div>
        <span className="h-3 w-px bg-white/15" aria-hidden />
        <div
          className="inline-flex items-baseline gap-2 whitespace-nowrap"
          title={`${formatCustomerCurrency(stats.totalRevenue)} total revenue`}
        >
          <span className="text-gray-500">Revenue</span>
          <span className="text-sm font-semibold text-white tabular-nums">
            {formatCustomerCurrency(stats.totalRevenue)}
          </span>
        </div>
      </div>
    </div>
  );
};
