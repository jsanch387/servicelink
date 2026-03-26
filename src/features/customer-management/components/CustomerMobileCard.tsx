import { GlassCard } from '@/components/shared';
import type { CustomerRecord } from '@/features/customer-management/types';
import { formatCustomerCurrency } from '@/features/customer-management/utils/customerFormatting';
import { formatLastBookedDate } from '@/features/customer-management/utils/formatLastBookedDate';
import { formatNextAppointmentRelativeDay } from '@/features/customer-management/utils/formatNextInDays';
import { mobileListStatusStyle } from '@/features/customer-management/utils/mobileListStatusStyle';
import { EllipsisHorizontalIcon } from '@heroicons/react/24/outline';
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
  onSendLink: _onSendLink,
}) => {
  const statusUi = mobileListStatusStyle(customer.status);
  const noPastVisits = customer.totalVisits === 0;

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
              {noPastVisits ? (
                <span className="min-w-0">No past visits yet</span>
              ) : (
                <>
                  <span className="min-w-0">
                    {customer.totalVisits}{' '}
                    {customer.totalVisits === 1 ? 'visit' : 'visits'} completed
                  </span>
                  <span className="h-3 w-px shrink-0 bg-white/20" aria-hidden />
                  <span className="shrink-0 tabular-nums text-gray-500">
                    Spent {formatCustomerCurrency(customer.totalSpent)}
                  </span>
                </>
              )}
            </div>
          </div>
          <EllipsisHorizontalIcon
            className="h-5 w-5 shrink-0 text-gray-500"
            aria-hidden
          />
        </div>

        <div className="mt-6 space-y-2 text-xs">
          {customer.nextAppointmentDate ? (
            <div className="flex items-start justify-between gap-3">
              <span className="shrink-0 text-gray-500">Next appointment</span>
              <div className="min-w-0 text-right">
                <p className="font-medium text-gray-200">
                  {formatLastBookedDate(customer.nextAppointmentDate)}
                </p>
                <p className="tabular-nums text-gray-500 mt-0.5">
                  {formatNextAppointmentRelativeDay(
                    customer.nextAppointmentDate,
                    customer.nextAppointmentDaysUntil
                  )}
                </p>
              </div>
            </div>
          ) : customer.lastVisitDate ? (
            <div className="flex items-start justify-between gap-3">
              <span className="shrink-0 text-gray-500">Last visit</span>
              <div className="min-w-0 text-right">
                <p className="font-medium text-gray-200">
                  {formatLastBookedDate(customer.lastVisitDate)}
                </p>
                <p className="tabular-nums text-gray-500 mt-0.5">
                  {customer.lastVisitDaysAgo}d ago
                </p>
              </div>
            </div>
          ) : (
            <p className="text-gray-500">No schedule yet</p>
          )}
        </div>
      </button>

      {/* Hidden for V2 rollout: restore send-link CTA when flow is ready.
      <div className="mt-3 border-t border-white/10 pt-3 flex justify-end">
        <button
          type="button"
          onClick={() => _onSendLink(customer)}
          className="inline-flex items-center gap-1.5 text-xs font-medium text-gray-300 hover:text-white transition-colors"
        >
          <PaperAirplaneIcon className="h-3.5 w-3.5 text-emerald-400" />
          <span>Send link</span>
        </button>
      </div>
      */}
    </GlassCard>
  );
};
