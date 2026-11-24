import type { CustomerRecord } from '@/features/customer-management/types';
import { formatCustomerCurrency } from '@/features/customer-management/utils/customerFormatting';
import { customerListSchedule } from '@/features/customer-management/utils/customerListPresentation';
import React from 'react';
import { CustomerListStatus } from './CustomerStatusBadge';

function CustomerScheduleCell({ customer }: { customer: CustomerRecord }) {
  const schedule = customerListSchedule(customer);

  return (
    <p
      className={`truncate text-sm ${schedule ? 'text-white' : 'text-white/60'}`}
    >
      {schedule ?? '—'}
    </p>
  );
}

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
    <div className="hidden overflow-x-auto rounded-2xl border border-white/[0.08] bg-white/[0.03] md:block">
      <table className="w-full table-fixed">
        <colgroup>
          <col span={5} />
        </colgroup>
        <thead>
          <tr className="border-b border-white/[0.08]">
            <th className="px-5 py-3.5 text-left text-sm font-medium text-white/60">
              Customer
            </th>
            <th className="px-5 py-3.5 text-left text-sm font-medium text-white/60">
              Visit
            </th>
            <th className="px-5 py-3.5 text-left text-sm font-medium text-white/60">
              Completed
            </th>
            <th className="px-5 py-3.5 text-left text-sm font-medium text-white/60">
              Total spent
            </th>
            <th className="px-5 py-3.5 text-left text-sm font-medium text-white/60">
              Status
            </th>
          </tr>
        </thead>
        <tbody>
          {customers.map(customer => (
            <tr
              key={customer.id}
              className="cursor-pointer border-b border-white/[0.06] transition-colors last:border-0 hover:bg-white/[0.04]"
              onClick={() => onRowClick(customer)}
            >
              <td className="px-5 py-4 align-middle">
                <p
                  className="truncate text-base font-semibold tracking-tight text-white"
                  title={customer.name}
                >
                  {customer.name}
                </p>
              </td>
              <td className="px-5 py-4 align-middle">
                <CustomerScheduleCell customer={customer} />
              </td>
              <td className="px-5 py-4 text-sm align-middle tabular-nums">
                {noPastVisits(customer) ? (
                  <span className="text-white/60">—</span>
                ) : (
                  <span className="text-white">{customer.totalVisits}</span>
                )}
              </td>
              <td className="px-5 py-4 text-sm align-middle font-medium tabular-nums">
                {noPastVisits(customer) ? (
                  <span className="text-white/60">—</span>
                ) : (
                  <span className="text-white">
                    {formatCustomerCurrency(customer.totalSpent)}
                  </span>
                )}
              </td>
              <td className="px-5 py-4 align-middle">
                <CustomerListStatus customer={customer} />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};
