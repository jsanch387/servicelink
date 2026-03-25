import { GlassCard } from '@/components/shared';
import type { CustomerRecord } from '@/features/customer-management/types';
import { formatCustomerCurrency } from '@/features/customer-management/utils/customerFormatting';
import { formatLastBookedDate } from '@/features/customer-management/utils/formatLastBookedDate';
import { mobileListStatusStyle } from '@/features/customer-management/utils/mobileListStatusStyle';
import {
  EllipsisHorizontalIcon,
  PaperAirplaneIcon,
} from '@heroicons/react/24/outline';
import React from 'react';

type CustomerCardAction = (_customer: CustomerRecord) => void;

interface CustomerMobileCardProps {
  customer: CustomerRecord;
  onOpenDetail: CustomerCardAction;
  onSendLink: CustomerCardAction;
}

export const CustomerMobileCard: React.FC<CustomerMobileCardProps> = ({
  customer,
  onOpenDetail,
  onSendLink,
}) => {
  const statusUi = mobileListStatusStyle(customer.status);

  return (
    <GlassCard rounded="rounded-2xl" className="p-4 border border-white/10">
      <button
        type="button"
        onClick={() => onOpenDetail(customer)}
        className="w-full text-left"
      >
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0 flex-1">
            <p className="text-lg font-bold text-white tracking-tight">
              {customer.name}
            </p>
            <div className="mt-1 flex min-w-0 flex-wrap items-center gap-x-2 gap-y-1 text-xs text-gray-400">
              <span className={statusUi.className}>{statusUi.label}</span>
              <span className="h-3 w-px shrink-0 bg-white/20" aria-hidden />
              <span className="min-w-0">
                {customer.totalVisits}{' '}
                {customer.totalVisits === 1 ? 'visit' : 'visits'} total
              </span>
              <span className="h-3 w-px shrink-0 bg-white/20" aria-hidden />
              <span className="shrink-0 tabular-nums text-gray-500">
                Spent {formatCustomerCurrency(customer.totalSpent)}
              </span>
            </div>
          </div>
          <EllipsisHorizontalIcon
            className="h-5 w-5 shrink-0 text-gray-500"
            aria-hidden
          />
        </div>

        <div className="mt-6 flex items-center justify-between gap-4">
          <div className="flex min-w-0 flex-1 items-center gap-3 text-xs">
            <span className="shrink-0 text-gray-500">Last booked:</span>
            <span className="min-w-0 truncate font-medium text-gray-200">
              {formatLastBookedDate(customer.lastBookingDate)}
            </span>
          </div>
          <span className="shrink-0 text-xs tabular-nums text-gray-500">
            {customer.lastBookingDaysAgo}d ago
          </span>
        </div>
      </button>

      <div className="mt-3 border-t border-white/10 pt-3 flex justify-end">
        <button
          type="button"
          onClick={() => onSendLink(customer)}
          className="inline-flex items-center gap-1.5 text-xs font-medium text-gray-300 hover:text-white transition-colors"
        >
          <PaperAirplaneIcon className="h-3.5 w-3.5 text-emerald-400" />
          <span>Send link</span>
        </button>
      </div>
    </GlassCard>
  );
};
