'use client';

import { deleteCustomerById } from '@/features/customer-management/api/deleteCustomer';
import { fetchCustomersList } from '@/features/customer-management/api/fetchCustomers';
import { updateCustomerNote } from '@/features/customer-management/api/updateCustomerNote';
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
  const [isSavingNote, setIsSavingNote] = useState(false);
  const [saveNoteError, setSaveNoteError] = useState<string | null>(null);

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

  const saveCustomerNote = useCallback(
    async (customerId: string, note: string) => {
      if (isSavingNote) {
        return {
          ok: false,
          error: 'A note save is already in progress.',
        } as const;
      }

      setIsSavingNote(true);
      setSaveNoteError(null);

      const result = await updateCustomerNote(customerId, note);

      if (!result.ok) {
        setSaveNoteError(result.error);
        setIsSavingNote(false);
        return result;
      }

      const nextNote = result.note;
      setCustomers(prev =>
        prev.map(customer =>
          customer.id === customerId
            ? { ...customer, note: nextNote }
            : customer
        )
      );
      setSelectedCustomer(prev =>
        prev && prev.id === customerId ? { ...prev, note: nextNote } : prev
      );
      setSaveNoteError(null);
      setIsSavingNote(false);
      return { ok: true as const };
    },
    [isSavingNote]
  );

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
    isSavingNote,
    saveNoteError,
    setSaveNoteError,
    openDeleteCustomerModal,
    confirmDeleteCustomer,
    saveCustomerNote,
  };
}
