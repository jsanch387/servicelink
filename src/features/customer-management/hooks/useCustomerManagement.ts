'use client';

import { MOCK_CUSTOMERS } from '@/features/customer-management/data/mockCustomers';
import type {
  CustomerLifecycle,
  CustomerListStats,
  CustomerRecord,
} from '@/features/customer-management/types';
import { matchesCustomerQuery } from '@/features/customer-management/utils/matchesCustomerQuery';
import { useMemo, useState } from 'react';

const DEFAULT_SMS_TEMPLATE =
  "Hey there, hope you're doing well!\nHere’s my booking link if you’d like to schedule your next appointment:\n\nmyservicelink.app/businessname";

export function useCustomerManagement() {
  const [customers, setCustomers] = useState<CustomerRecord[]>(MOCK_CUSTOMERS);
  const [query, setQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | CustomerLifecycle>(
    'all'
  );
  const [selectedCustomer, setSelectedCustomer] =
    useState<CustomerRecord | null>(null);
  const [activeSendLinkCustomer, setActiveSendLinkCustomer] =
    useState<CustomerRecord | null>(null);
  const [templateMessage, setTemplateMessage] = useState(DEFAULT_SMS_TEMPLATE);

  const filteredCustomers = useMemo(() => {
    return customers.filter(customer => {
      const passesStatus =
        statusFilter === 'all' || customer.status === statusFilter;
      const passesSearch =
        !query.trim() || matchesCustomerQuery(customer, query);
      return passesStatus && passesSearch;
    });
  }, [customers, query, statusFilter]);

  const stats: CustomerListStats = useMemo(() => {
    const totalCustomers = customers.length;
    const returningCustomers = customers.filter(
      customer => customer.status === 'returning'
    ).length;
    const totalRevenue = customers.reduce(
      (sum, customer) => sum + customer.totalSpent,
      0
    );
    return { totalCustomers, returningCustomers, totalRevenue };
  }, [customers]);

  const deleteCustomer = (customer: CustomerRecord): void => {
    const confirmed = window.confirm(
      `Delete ${customer.name} from your customer list?`
    );
    if (!confirmed) {
      return;
    }
    setCustomers(prev => prev.filter(item => item.id !== customer.id));
    setSelectedCustomer(null);
    setActiveSendLinkCustomer(prev => (prev?.id === customer.id ? null : prev));
  };

  return {
    customers,
    setCustomers,
    query,
    setQuery,
    statusFilter,
    setStatusFilter,
    filteredCustomers,
    stats,
    selectedCustomer,
    setSelectedCustomer,
    activeSendLinkCustomer,
    setActiveSendLinkCustomer,
    templateMessage,
    setTemplateMessage,
    deleteCustomer,
  };
}
