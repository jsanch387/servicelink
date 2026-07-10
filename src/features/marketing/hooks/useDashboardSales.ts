'use client';

import { useCallback, useEffect, useState } from 'react';
import type {
  MarketingDeleteResponse,
  SaleCreateResponse,
  SaleDetailResponse,
  SalesListResponse,
  SaleUpdateResponse,
} from '../api/types';
import type { Sale } from '../types';
import { normalizeSaleFromApi } from '../utils/normalizeSaleFromApi';

type LoadStatus = 'loading' | 'ready' | 'error';

export interface UseDashboardSalesResult {
  sales: Sale[];
  loadStatus: LoadStatus;
  loadError: string | null;
  reloadSales: () => Promise<void>;
  toggleSaleActive: (id: string, isActive: boolean) => Promise<void>;
  togglingId: string | null;
  toggleError: string | null;
  clearToggleError: () => void;
  deleteSale: (id: string) => Promise<void>;
  deletingId: string | null;
  deleteError: string | null;
  clearDeleteError: () => void;
}

export function useDashboardSales(): UseDashboardSalesResult {
  const [sales, setSales] = useState<Sale[]>([]);
  const [loadStatus, setLoadStatus] = useState<LoadStatus>('loading');
  const [loadError, setLoadError] = useState<string | null>(null);
  const [togglingId, setTogglingId] = useState<string | null>(null);
  const [toggleError, setToggleError] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  const clearToggleError = useCallback(() => {
    setToggleError(null);
  }, []);

  const clearDeleteError = useCallback(() => {
    setDeleteError(null);
  }, []);

  const reloadSales = useCallback(async () => {
    setLoadError(null);

    try {
      const response = await fetch('/api/marketing/sales', { method: 'GET' });
      const json = (await response
        .json()
        .catch(() => null)) as SalesListResponse | null;

      if (!response.ok || !json?.success) {
        const message =
          json && !json.success ? json.error : 'Failed to load sales';
        throw new Error(message);
      }

      setSales(
        Array.isArray(json.sales) ? json.sales.map(normalizeSaleFromApi) : []
      );
      setLoadStatus('ready');
    } catch (error) {
      const message =
        error instanceof Error ? error.message : 'Failed to load sales';
      setLoadError(message);
      setLoadStatus('error');
      setSales([]);
    }
  }, []);

  const toggleSaleActive = useCallback(
    async (id: string, isActive: boolean) => {
      setTogglingId(id);
      setToggleError(null);
      setSales(prev =>
        prev.map(sale => (sale.id === id ? { ...sale, isActive } : sale))
      );

      try {
        const response = await fetch(`/api/marketing/sales/${id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ isActive }),
        });
        const json = (await response
          .json()
          .catch(() => null)) as SaleUpdateResponse | null;

        if (!response.ok || !json?.success) {
          const message =
            json && !json.success ? json.error : 'Failed to update sale';
          throw new Error(message);
        }

        setSales(prev =>
          prev.map(sale => {
            if (sale.id === id) {
              return normalizeSaleFromApi(json.sale);
            }
            if (isActive && sale.isActive) {
              return { ...sale, isActive: false };
            }
            return sale;
          })
        );
      } catch (error) {
        const message =
          error instanceof Error ? error.message : 'Failed to update sale';
        setToggleError(message);
        setSales(prev =>
          prev.map(sale =>
            sale.id === id ? { ...sale, isActive: !isActive } : sale
          )
        );
        console.error('[marketing] toggleSaleActive failed', error);
      } finally {
        setTogglingId(null);
      }
    },
    []
  );

  const deleteSale = useCallback(async (id: string) => {
    setDeletingId(id);
    setDeleteError(null);

    try {
      await deleteSaleRequest(id);
      setSales(prev => prev.filter(sale => sale.id !== id));
    } catch (error) {
      const message =
        error instanceof Error ? error.message : 'Failed to delete sale';
      setDeleteError(message);
      throw error;
    } finally {
      setDeletingId(null);
    }
  }, []);

  useEffect(() => {
    setLoadStatus('loading');
    void reloadSales();
  }, [reloadSales]);

  return {
    sales,
    loadStatus,
    loadError,
    reloadSales,
    toggleSaleActive,
    togglingId,
    toggleError,
    clearToggleError,
    deleteSale,
    deletingId,
    deleteError,
    clearDeleteError,
  };
}

export async function fetchSaleById(saleId: string): Promise<Sale> {
  const response = await fetch(
    `/api/marketing/sales/${encodeURIComponent(saleId)}`,
    { method: 'GET' }
  );
  const json = (await response
    .json()
    .catch(() => null)) as SaleDetailResponse | null;

  if (!response.ok || !json?.success) {
    const message = json && !json.success ? json.error : 'Failed to load sale';
    throw new Error(message);
  }

  return normalizeSaleFromApi(json.sale);
}

export async function createSaleRequest(
  payload: Record<string, unknown>
): Promise<Sale> {
  const response = await fetch('/api/marketing/sales', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  const json = (await response
    .json()
    .catch(() => null)) as SaleCreateResponse | null;

  if (!response.ok || !json?.success) {
    const message =
      json && !json.success ? json.error : 'Failed to create sale';
    throw new Error(message);
  }

  return normalizeSaleFromApi(json.sale);
}

export async function updateSaleRequest(
  saleId: string,
  payload: Record<string, unknown>
): Promise<Sale> {
  const response = await fetch(
    `/api/marketing/sales/${encodeURIComponent(saleId)}`,
    {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    }
  );
  const json = (await response
    .json()
    .catch(() => null)) as SaleUpdateResponse | null;

  if (!response.ok || !json?.success) {
    const message =
      json && !json.success ? json.error : 'Failed to update sale';
    throw new Error(message);
  }

  return normalizeSaleFromApi(json.sale);
}

export async function deleteSaleRequest(saleId: string): Promise<void> {
  const response = await fetch(
    `/api/marketing/sales/${encodeURIComponent(saleId)}`,
    { method: 'DELETE' }
  );
  const json = (await response
    .json()
    .catch(() => null)) as MarketingDeleteResponse | null;

  if (!response.ok || !json?.success) {
    const message =
      json && !json.success ? json.error : 'Failed to delete sale';
    throw new Error(message);
  }
}
