'use client';

import { useCallback, useEffect, useState } from 'react';
import type {
  MarketingDeleteResponse,
  PromoCodeCreateResponse,
  PromoCodeDetailResponse,
  PromoCodesListResponse,
  PromoCodeUpdateResponse,
} from '../api/types';
import type { PromoCode } from '../types';
import { normalizePromoCodeFromApi } from '../utils/normalizePromoCodeFromApi';

type LoadStatus = 'loading' | 'ready' | 'error';

export interface UseDashboardPromoCodesResult {
  promoCodes: PromoCode[];
  loadStatus: LoadStatus;
  loadError: string | null;
  reloadPromoCodes: () => Promise<void>;
  togglePromoCodeActive: (id: string, isActive: boolean) => Promise<void>;
  togglingId: string | null;
  toggleError: string | null;
  clearToggleError: () => void;
  deletePromoCode: (id: string) => Promise<void>;
  deletingId: string | null;
  deleteError: string | null;
  clearDeleteError: () => void;
}

export function useDashboardPromoCodes(): UseDashboardPromoCodesResult {
  const [promoCodes, setPromoCodes] = useState<PromoCode[]>([]);
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

  const reloadPromoCodes = useCallback(async () => {
    setLoadError(null);

    try {
      const response = await fetch('/api/marketing/promo-codes', {
        method: 'GET',
      });
      const json = (await response
        .json()
        .catch(() => null)) as PromoCodesListResponse | null;

      if (!response.ok || !json?.success) {
        const message =
          json && !json.success ? json.error : 'Failed to load promo codes';
        throw new Error(message);
      }

      setPromoCodes(
        Array.isArray(json.promoCodes)
          ? json.promoCodes.map(normalizePromoCodeFromApi)
          : []
      );
      setLoadStatus('ready');
    } catch (error) {
      const message =
        error instanceof Error ? error.message : 'Failed to load promo codes';
      setLoadError(message);
      setLoadStatus('error');
      setPromoCodes([]);
    }
  }, []);

  const togglePromoCodeActive = useCallback(
    async (id: string, isActive: boolean) => {
      setTogglingId(id);
      setToggleError(null);
      setPromoCodes(prev =>
        prev.map(promoCode =>
          promoCode.id === id ? { ...promoCode, isActive } : promoCode
        )
      );

      try {
        const response = await fetch(`/api/marketing/promo-codes/${id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ isActive }),
        });
        const json = (await response
          .json()
          .catch(() => null)) as PromoCodeUpdateResponse | null;

        if (!response.ok || !json?.success) {
          const message =
            json && !json.success ? json.error : 'Failed to update promo code';
          throw new Error(message);
        }

        setPromoCodes(prev =>
          prev.map(promoCode =>
            promoCode.id === id
              ? normalizePromoCodeFromApi(json.promoCode)
              : promoCode
          )
        );
      } catch (error) {
        const message =
          error instanceof Error
            ? error.message
            : 'Failed to update promo code';
        setToggleError(message);
        setPromoCodes(prev =>
          prev.map(promoCode =>
            promoCode.id === id
              ? { ...promoCode, isActive: !isActive }
              : promoCode
          )
        );
        console.error('[marketing] togglePromoCodeActive failed', error);
      } finally {
        setTogglingId(null);
      }
    },
    []
  );

  const deletePromoCode = useCallback(async (id: string) => {
    setDeletingId(id);
    setDeleteError(null);

    try {
      await deletePromoCodeRequest(id);
      setPromoCodes(prev => prev.filter(promoCode => promoCode.id !== id));
    } catch (error) {
      const message =
        error instanceof Error ? error.message : 'Failed to delete promo code';
      setDeleteError(message);
      throw error;
    } finally {
      setDeletingId(null);
    }
  }, []);

  useEffect(() => {
    setLoadStatus('loading');
    void reloadPromoCodes();
  }, [reloadPromoCodes]);

  return {
    promoCodes,
    loadStatus,
    loadError,
    reloadPromoCodes,
    togglePromoCodeActive,
    togglingId,
    toggleError,
    clearToggleError,
    deletePromoCode,
    deletingId,
    deleteError,
    clearDeleteError,
  };
}

export async function fetchPromoCodeById(
  promoCodeId: string
): Promise<PromoCode> {
  const response = await fetch(
    `/api/marketing/promo-codes/${encodeURIComponent(promoCodeId)}`,
    { method: 'GET' }
  );
  const json = (await response
    .json()
    .catch(() => null)) as PromoCodeDetailResponse | null;

  if (!response.ok || !json?.success) {
    const message =
      json && !json.success ? json.error : 'Failed to load promo code';
    throw new Error(message);
  }

  return normalizePromoCodeFromApi(json.promoCode);
}

export async function createPromoCodeRequest(
  payload: Record<string, unknown>
): Promise<PromoCode> {
  const response = await fetch('/api/marketing/promo-codes', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  const json = (await response
    .json()
    .catch(() => null)) as PromoCodeCreateResponse | null;

  if (!response.ok || !json?.success) {
    const message =
      json && !json.success ? json.error : 'Failed to create promo code';
    throw new Error(message);
  }

  return normalizePromoCodeFromApi(json.promoCode);
}

export async function updatePromoCodeRequest(
  promoCodeId: string,
  payload: Record<string, unknown>
): Promise<PromoCode> {
  const response = await fetch(
    `/api/marketing/promo-codes/${encodeURIComponent(promoCodeId)}`,
    {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    }
  );
  const json = (await response
    .json()
    .catch(() => null)) as PromoCodeUpdateResponse | null;

  if (!response.ok || !json?.success) {
    const message =
      json && !json.success ? json.error : 'Failed to update promo code';
    throw new Error(message);
  }

  return normalizePromoCodeFromApi(json.promoCode);
}

export async function deletePromoCodeRequest(
  promoCodeId: string
): Promise<void> {
  const response = await fetch(
    `/api/marketing/promo-codes/${encodeURIComponent(promoCodeId)}`,
    { method: 'DELETE' }
  );
  const json = (await response
    .json()
    .catch(() => null)) as MarketingDeleteResponse | null;

  if (!response.ok || !json?.success) {
    const message =
      json && !json.success ? json.error : 'Failed to delete promo code';
    throw new Error(message);
  }
}
