import type { CustomerRecord } from '@/features/customer-management/types';
import { formatCustomerCurrency } from '@/features/customer-management/utils/customerFormatting';
import { formatLastBookedDate } from '@/features/customer-management/utils/formatLastBookedDate';
import { formatNextAppointmentRelativeDay } from '@/features/customer-management/utils/formatNextInDays';
import { EllipsisHorizontalIcon } from '@heroicons/react/24/outline';
import React from 'react';
import { CustomerStatusBadge } from './CustomerStatusBadge';

type CustomerRowAction = (_customer: CustomerRecord) => void;

interface CustomerDesktopTableProps {
  customers: CustomerRecord[];
  onRowClick: CustomerRowAction;
}

export const CustomerDesktopTable: React.FC<CustomerDesktopTableProps> = ({
  customers,
  onRowClick,
}) => {
  const noPastVisits = (c: (typeof customers)[number]) => c.totalVisits === 0;

  return (
    <div className="hidden md:block overflow-x-auto rounded-lg border border-white/10 bg-white/[0.02]">
      <table className="min-w-full">
        <thead>
          <tr className="border-b border-white/10">
            <th className="px-4 py-3 text-left text-xs font-semibold text-gray-400">
              Customer
            </th>
            <th className="px-4 py-3 text-left text-xs font-semibold text-gray-400">
              Schedule
            </th>
            <th className="px-4 py-3 text-left text-xs font-semibold text-gray-400">
              Completed
            </th>
            <th className="px-4 py-3 text-left text-xs font-semibold text-gray-400">
              Total spent
            </th>
            <th className="px-4 py-3 text-left text-xs font-semibold text-gray-400">
              Tag
            </th>
            <th className="w-10 px-3 py-3" aria-hidden />
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
              <td className="px-4 py-3 align-middle min-w-[12rem]">
                {customer.nextAppointmentDate ? (
                  <div>
                    <p className="text-sm text-gray-200">
                      Next appointment{' '}
                      {formatLastBookedDate(customer.nextAppointmentDate)}
                    </p>
                    <p className="text-xs text-gray-400 mt-0.5">
                      {formatNextAppointmentRelativeDay(
                        customer.nextAppointmentDate,
                        customer.nextAppointmentDaysUntil
                      )}
                    </p>
                  </div>
                ) : customer.lastVisitDate ? (
                  <div>
                    <p className="text-sm text-gray-200">
                      Last visit {formatLastBookedDate(customer.lastVisitDate)}
                    </p>
                    <p className="text-xs text-gray-400 mt-0.5">
                      {customer.lastVisitDaysAgo}{' '}
                      {customer.lastVisitDaysAgo === 1 ? 'day' : 'days'} ago
                    </p>
                  </div>
                ) : (
                  <p className="text-sm text-gray-500">—</p>
                )}
              </td>
              <td className="px-4 py-3 text-sm align-middle tabular-nums">
                {noPastVisits(customer) ? (
                  <span className="text-gray-500">None yet</span>
                ) : (
                  <span className="text-gray-200">
                    {customer.totalVisits}{' '}
                    {customer.totalVisits === 1 ? 'visit' : 'visits'}
                  </span>
                )}
              </td>
              <td className="px-4 py-3 text-sm align-middle tabular-nums font-medium">
                {noPastVisits(customer) ? (
                  <span className="text-gray-500">—</span>
                ) : (
                  <span className="text-gray-200">
                    {formatCustomerCurrency(customer.totalSpent)}
                  </span>
                )}
              </td>
              <td className="px-4 py-3 align-middle">
                <CustomerStatusBadge status={customer.status} />
              </td>
              <td className="px-3 py-3 align-middle text-right">
                <EllipsisHorizontalIcon className="h-4 w-4 text-gray-500" />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};
