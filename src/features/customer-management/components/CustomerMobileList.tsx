import type { CustomerRecord } from '@/features/customer-management/types';
import React from 'react';
import { CustomerMobileCard } from './CustomerMobileCard';

type CustomerCardAction = (_customer: CustomerRecord) => void;

interface CustomerMobileListProps {
  customers: CustomerRecord[];
  onOpenDetail: CustomerCardAction;
  onSendLink: CustomerCardAction;
}

export const CustomerMobileList: React.FC<CustomerMobileListProps> = ({
  customers,
  onOpenDetail,
  onSendLink,
}) => {
  return (
    <div className="md:hidden space-y-3">
      {customers.map(customer => (
        <CustomerMobileCard
          key={customer.id}
          customer={customer}
          onOpenDetail={onOpenDetail}
          onSendLink={onSendLink}
        />
      ))}
    </div>
  );
};
