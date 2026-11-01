import type { CustomerRecord } from '@/features/customer-management/types';
import { formatCustomerCurrency } from '@/features/customer-management/utils/customerFormatting';
import { customerListSchedule } from '@/features/customer-management/utils/customerListPresentation';
import React from 'react';
import { CustomerListStatus } from './CustomerStatusBadge';

type CustomerCardAction = (_customer: CustomerRecord) => void;

interface CustomerMobileCardProps {
  customer: CustomerRecord;
  onOpenDetail: CustomerCardAction;
}

export const CustomerMobileCard: React.FC<CustomerMobileCardProps> = ({
  customer,
  onOpenDetail,
}) => {
  const schedule = customerListSchedule(customer);
  const noPastVisits = customer.totalVisits === 0;

  return (
    <button
      type="button"
      onClick={() => onOpenDetail(customer)}
      className="w-full cursor-pointer rounded-[10px] border border-white/[0.08] bg-white/[0.03] p-4 text-left"
    >
      <div className="flex items-baseline justify-between gap-3">
        <p className="min-w-0 truncate text-base font-semibold tracking-tight text-white">
          {customer.name}
        </p>
        <span className="shrink-0">
          <CustomerListStatus customer={customer} />
        </span>
      </div>
      <div className="mt-3 flex items-baseline justify-between gap-3 text-sm">
        <p className="min-w-0 truncate text-white/60">{schedule ?? '—'}</p>
        {noPastVisits ? null : (
          <p className="shrink-0 tabular-nums font-medium text-white">
            {formatCustomerCurrency(customer.totalSpent)}
          </p>
        )}
      </div>
    </button>
  );
};
