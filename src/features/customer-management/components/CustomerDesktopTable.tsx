import type { CustomerRecord } from '@/features/customer-management/types';
import { formatCustomerCurrency } from '@/features/customer-management/utils/customerFormatting';
import { formatLastBookedDate } from '@/features/customer-management/utils/formatLastBookedDate';
import { PaperAirplaneIcon } from '@heroicons/react/24/outline';
import React from 'react';
import { CustomerStatusBadge } from './CustomerStatusBadge';

type CustomerRowAction = (_customer: CustomerRecord) => void;

interface CustomerDesktopTableProps {
  customers: CustomerRecord[];
  onRowClick: CustomerRowAction;
  onSendLink: CustomerRowAction;
}

export const CustomerDesktopTable: React.FC<CustomerDesktopTableProps> = ({
  customers,
  onRowClick,
  onSendLink,
}) => {
  return (
    <div className="hidden md:block overflow-x-auto rounded-2xl border border-white/10 bg-white/[0.02]">
      <table className="min-w-full">
        <thead>
          <tr className="border-b border-white/10">
            <th className="px-4 py-3 text-left text-xs font-semibold text-gray-400">
              Customer
            </th>
            <th className="px-4 py-3 text-left text-xs font-semibold text-gray-400">
              Last booked
            </th>
            <th className="px-4 py-3 text-left text-xs font-semibold text-gray-400">
              Visits
            </th>
            <th className="px-4 py-3 text-left text-xs font-semibold text-gray-400">
              Total spent
            </th>
            <th className="px-4 py-3 text-left text-xs font-semibold text-gray-400">
              Tag
            </th>
            <th className="px-4 py-3 text-left text-xs font-semibold text-gray-400">
              Action
            </th>
          </tr>
        </thead>
        <tbody>
          {customers.map(customer => (
            <tr
              key={customer.id}
              className="border-b border-white/5 last:border-0 cursor-pointer hover:bg-white/[0.03] transition-colors"
              onClick={() => onRowClick(customer)}
            >
              <td className="px-4 py-3 align-middle">
                <p className="text-base font-semibold text-white tracking-tight">
                  {customer.name}
                </p>
              </td>
              <td className="px-4 py-3 align-middle min-w-[10rem]">
                <p className="text-sm text-gray-200">
                  {formatLastBookedDate(customer.lastBookingDate)}
                </p>
                <p className="text-xs text-gray-400 mt-0.5">
                  {customer.lastBookingDaysAgo} days ago
                </p>
              </td>
              <td className="px-4 py-3 text-sm text-gray-200 align-middle tabular-nums">
                {customer.totalVisits}{' '}
                {customer.totalVisits === 1 ? 'visit' : 'visits'}
              </td>
              <td className="px-4 py-3 text-sm text-gray-200 align-middle tabular-nums font-medium">
                {formatCustomerCurrency(customer.totalSpent)}
              </td>
              <td className="px-4 py-3 align-middle">
                <CustomerStatusBadge status={customer.status} />
              </td>
              <td
                className="px-4 py-3 align-middle"
                onClick={e => e.stopPropagation()}
              >
                <button
                  type="button"
                  onClick={() => onSendLink(customer)}
                  className="inline-flex items-center gap-1.5 text-xs font-medium text-gray-300 hover:text-white transition-colors"
                >
                  <PaperAirplaneIcon className="h-3.5 w-3.5 text-emerald-400" />
                  <span>Send link</span>
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};
