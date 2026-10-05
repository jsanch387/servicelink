'use client';

import { API_ROUTES } from '@/constants/routes';
import { useCallback, useEffect, useState } from 'react';

import type { InvoiceListItem, InvoiceStatus } from '../types';

type LoadStatus = 'loading' | 'ready' | 'error';

type InvoicesListResponse = {
  success?: boolean;
  error?: string;
  invoices?: InvoiceListItem[];
};

export function useDashboardInvoices() {
  const [invoices, setInvoices] = useState<InvoiceListItem[]>([]);
  const [loadStatus, setLoadStatus] = useState<LoadStatus>('loading');
  const [loadError, setLoadError] = useState<string | null>(null);

  const reloadInvoices = useCallback(async () => {
    setLoadStatus('loading');
    setLoadError(null);
    try {
      const response = await fetch(API_ROUTES.INVOICES);
      const json = (await response
        .json()
        .catch(() => null)) as InvoicesListResponse | null;

      if (!response.ok || !json?.success) {
        throw new Error(json?.error || 'Could not load invoices.');
      }

      setInvoices(Array.isArray(json.invoices) ? json.invoices : []);
      setLoadStatus('ready');
    } catch (error) {
      const message =
        error instanceof Error ? error.message : 'Could not load invoices.';
      setLoadError(message);
      setLoadStatus('error');
    }
  }, []);

  useEffect(() => {
    void reloadInvoices();
  }, [reloadInvoices]);

  const removeInvoice = useCallback((invoiceId: string) => {
    setInvoices(current => current.filter(invoice => invoice.id !== invoiceId));
  }, []);

  const setInvoiceStatus = useCallback(
    (invoiceId: string, status: InvoiceStatus) => {
      setInvoices(current =>
        current.map(invoice =>
          invoice.id === invoiceId ? { ...invoice, status } : invoice
        )
      );
    },
    []
  );

  return {
    invoices,
    loadStatus,
    loadError,
    reloadInvoices,
    removeInvoice,
    setInvoiceStatus,
  };
}
