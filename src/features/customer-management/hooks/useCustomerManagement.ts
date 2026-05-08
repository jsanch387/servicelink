'use client';

import { createCustomerRequest } from '@/features/customer-management/api/createCustomer';
import { deleteCustomerById } from '@/features/customer-management/api/deleteCustomer';
import { fetchCustomersList } from '@/features/customer-management/api/fetchCustomers';
import { updateCustomerNote } from '@/features/customer-management/api/updateCustomerNote';
import type {
  AddCustomerDraft,
  CustomerLifecycle,
  CustomerListStats,
  CustomerRecord,
} from '@/features/customer-management/types';
import { isCustomerNeedsAttention } from '@/features/customer-management/utils/customerAttention';
import { matchesCustomerQuery } from '@/features/customer-management/utils/matchesCustomerQuery';
import { buildSmsHref } from '@/features/customer-management/utils/smsLink';
import { useCallback, useEffect, useMemo, useState } from 'react';

const BOOKING_LINK_PLACEHOLDER = 'myservicelink.app/businessname';
const BUSINESS_NAME_PLACEHOLDER = '[Business Name]';

function messageTemplateForCustomer(
  customerName: string,
  businessName: string,
  bookingLink: string
): string {
  const firstName = customerName.trim().split(' ')[0] || 'there';
  return `Hey ${firstName}! It's ${businessName}. If you need a refresh, here's my booking link:\n\n${bookingLink}`;
}

function winBackTemplateForCustomer(
  customerName: string,
  businessName: string,
  bookingLink: string
): string {
  const firstName = customerName.trim().split(' ')[0] || 'there';
  return `Hey ${firstName}! It's ${businessName}. Realized it's been a few months since your last detail and wanted to check in. If you need a refresh, here's my booking link:\n\n${bookingLink}`;
}

type LoadStatus = 'loading' | 'ready' | 'error';
type StatusFilter = 'all' | CustomerLifecycle | 'needs_attention';
type SmsMode = 'message' | 'win_back';
const DEMO_CUSTOMER_ID_PREFIX = 'demo_';

export function useCustomerManagement() {
  const [loadStatus, setLoadStatus] = useState<LoadStatus>('loading');
  const [loadError, setLoadError] = useState<string | null>(null);
  const [customers, setCustomers] = useState<CustomerRecord[]>([]);

  const [query, setQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [selectedCustomer, setSelectedCustomer] =
    useState<CustomerRecord | null>(null);
  const [smsBusinessName, setSmsBusinessName] = useState(
    BUSINESS_NAME_PLACEHOLDER
  );
  const [smsBookingLink, setSmsBookingLink] = useState(
    BOOKING_LINK_PLACEHOLDER
  );

  const [activeDeleteCustomer, setActiveDeleteCustomer] =
    useState<CustomerRecord | null>(null);
  const [isDeletingCustomer, setIsDeletingCustomer] = useState(false);
  const [deleteCustomerError, setDeleteCustomerError] = useState<string | null>(
    null
  );
  const [isSavingNote, setIsSavingNote] = useState(false);
  const [saveNoteError, setSaveNoteError] = useState<string | null>(null);

  const loadCustomers = useCallback(async (opts?: { silent?: boolean }) => {
    const silent = opts?.silent ?? false;
    if (!silent) {
      setLoadStatus('loading');
      setLoadError(null);
    }
    const result = await fetchCustomersList();
    if (result.ok) {
      setCustomers(result.customers);
      setSmsBusinessName(result.businessName ?? BUSINESS_NAME_PLACEHOLDER);
      setSmsBookingLink(result.businessBookingLink || BOOKING_LINK_PLACEHOLDER);
      if (!silent) {
        setLoadStatus('ready');
      }
    } else if (!silent) {
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
        statusFilter === 'all'
          ? true
          : statusFilter === 'needs_attention'
            ? isCustomerNeedsAttention(customer)
            : customer.status === statusFilter;
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
    if (customerToDelete.id.startsWith(DEMO_CUSTOMER_ID_PREFIX)) {
      setActiveDeleteCustomer(null);
      setSelectedCustomer(prev =>
        prev?.id === customerToDelete.id ? null : prev
      );
      return;
    }

    setIsDeletingCustomer(true);
    setDeleteCustomerError(null);

    const result = await deleteCustomerById(customerToDelete.id);

    if (result.ok) {
      setActiveDeleteCustomer(null);
      setSelectedCustomer(prev =>
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
      if (customerId.startsWith(DEMO_CUSTOMER_ID_PREFIX)) {
        const nextNote = note.trim();
        setSelectedCustomer(prev =>
          prev && prev.id === customerId ? { ...prev, note: nextNote } : prev
        );
        return { ok: true as const };
      }

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

  const createCustomer = useCallback(
    async (draft: AddCustomerDraft) => {
      const result = await createCustomerRequest(draft);
      if (!result.ok) {
        return result;
      }
      await loadCustomers({ silent: true });
      return { ok: true as const };
    },
    [loadCustomers]
  );

  const openCustomerSms = useCallback(
    (customer: CustomerRecord, mode: SmsMode) => {
      const body =
        mode === 'win_back'
          ? winBackTemplateForCustomer(
              customer.name,
              smsBusinessName,
              smsBookingLink
            )
          : messageTemplateForCustomer(
              customer.name,
              smsBusinessName,
              smsBookingLink
            );
      const href = buildSmsHref(customer.phone, body);
      if (!href || typeof window === 'undefined') {
        return;
      }
      window.location.href = href;
    },
    [smsBookingLink, smsBusinessName]
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
    createCustomer,
    openCustomerSms,
  };
}
