'use client';

import { deleteCustomerById } from '@/features/customer-management/api/deleteCustomer';
import { fetchCustomersList } from '@/features/customer-management/api/fetchCustomers';
import type {
  CustomerLifecycle,
  CustomerListStats,
  CustomerRecord,
} from '@/features/customer-management/types';
import { matchesCustomerQuery } from '@/features/customer-management/utils/matchesCustomerQuery';
import { useCallback, useEffect, useMemo, useState } from 'react';

const DEFAULT_SMS_TEMPLATE =
  "Hey there, hope you're doing well!\nHere’s my booking link if you’d like to schedule your next appointment:\n\nmyservicelink.app/businessname";

type LoadStatus = 'loading' | 'ready' | 'error';

export function useCustomerManagement() {
  const [loadStatus, setLoadStatus] = useState<LoadStatus>('loading');
  const [loadError, setLoadError] = useState<string | null>(null);
  const [customers, setCustomers] = useState<CustomerRecord[]>([]);

  const [query, setQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | CustomerLifecycle>(
    'all'
  );
  const [selectedCustomer, setSelectedCustomer] =
    useState<CustomerRecord | null>(null);
  const [activeSendLinkCustomer, setActiveSendLinkCustomer] =
    useState<CustomerRecord | null>(null);
  const [templateMessage, setTemplateMessage] = useState(DEFAULT_SMS_TEMPLATE);

  const [activeDeleteCustomer, setActiveDeleteCustomer] =
    useState<CustomerRecord | null>(null);
  const [isDeletingCustomer, setIsDeletingCustomer] = useState(false);
  const [deleteCustomerError, setDeleteCustomerError] = useState<string | null>(
    null
  );

  const loadCustomers = useCallback(async () => {
    setLoadStatus('loading');
    setLoadError(null);
    const result = await fetchCustomersList();
    if (result.ok) {
      setCustomers(result.customers);
      setLoadStatus('ready');
    } else {
      setLoadError(result.error);
      setLoadStatus('error');
    }
  }, []);

  useEffect(() => {
    void loadCustomers();
  }, [loadCustomers]);

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

  const openDeleteCustomerModal = useCallback((customer: CustomerRecord) => {
    setDeleteCustomerError(null);
    setActiveDeleteCustomer(customer);
  }, []);

  const confirmDeleteCustomer = useCallback(async () => {
    if (!activeDeleteCustomer || isDeletingCustomer) return;

    const customerToDelete = activeDeleteCustomer;
    setIsDeletingCustomer(true);
    setDeleteCustomerError(null);

    const result = await deleteCustomerById(customerToDelete.id);

    if (result.ok) {
      setActiveDeleteCustomer(null);
      setSelectedCustomer(prev =>
        prev?.id === customerToDelete.id ? null : prev
      );
      setActiveSendLinkCustomer(prev =>
        prev?.id === customerToDelete.id ? null : prev
      );
      await loadCustomers();
    } else {
      setDeleteCustomerError(result.error);
    }

    setIsDeletingCustomer(false);
  }, [activeDeleteCustomer, isDeletingCustomer, loadCustomers]);

  return {
    loadStatus,
    loadError,
    reloadCustomers: loadCustomers,
    customers,
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
    activeDeleteCustomer,
    setActiveDeleteCustomer,
    isDeletingCustomer,
    deleteCustomerError,
    openDeleteCustomerModal,
    confirmDeleteCustomer,
  };
}
