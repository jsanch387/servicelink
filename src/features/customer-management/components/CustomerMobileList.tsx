import type { CustomerRecord } from '@/features/customer-management/types';
import React from 'react';
import { CustomerMobileCard } from './CustomerMobileCard';

type CustomerCardAction = (_customer: CustomerRecord) => void;

interface CustomerMobileListProps {
  customers: CustomerRecord[];
  onOpenDetail: CustomerCardAction;
}

export const CustomerMobileList: React.FC<CustomerMobileListProps> = ({
  customers,
  onOpenDetail,
}) => {
  return (
    <div className="space-y-2 md:hidden">
      {customers.map(customer => (
        <CustomerMobileCard
          key={customer.id}
          customer={customer}
          onOpenDetail={onOpenDetail}
        />
      ))}
    </div>
  );
};
