'use client';

/**
 * Loads and caches the current user's business availability.
 * - Fetches once per session; cached so revisiting the page does not refetch.
 * - After save, use updateFromSave(responseData) instead of refetching.
 */

import { useCallback, useEffect } from 'react';
import { useAvailabilityDataStore } from '../stores/availabilityDataStore';
import type { BusinessAvailabilityRow } from '../types/availability';

interface UseAvailabilityResult {
  data: BusinessAvailabilityRow | null;
  loading: boolean;
  error: string | null;
  /** Update cache from a successful POST save (avoids refetch). */

  updateFromSave: (row: BusinessAvailabilityRow) => void;
  /** Force a fresh fetch (e.g. when cache should be invalidated). */
  refetch: () => Promise<void>;
}

export function useAvailability(
  enabled: boolean = true
): UseAvailabilityResult {
  const row = useAvailabilityDataStore(s => s.row);
  const hasFetched = useAvailabilityDataStore(s => s.hasFetched);
  const loading = useAvailabilityDataStore(s => s.loading);
  const error = useAvailabilityDataStore(s => s.error);
  const setRow = useAvailabilityDataStore(s => s.setRow);
  const setHasFetched = useAvailabilityDataStore(s => s.setHasFetched);
  const setLoading = useAvailabilityDataStore(s => s.setLoading);
  const setError = useAvailabilityDataStore(s => s.setError);
  const updateFromSave = useAvailabilityDataStore(s => s.updateFromSave);

  const fetchAvailability = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/availability');
      const json = await res.json();
      if (!res.ok) {
        setError(json.error ?? 'Failed to load availability');
        setRow(null);
        return;
      }
      if (json.success) {
        setRow(json.data ?? null);
      } else {
        setError(json.error ?? 'Failed to load availability');
        setRow(null);
      }
    } catch {
      setError('Failed to load availability');
      setRow(null);
    } finally {
      setLoading(false);
      setHasFetched(true);
    }
  }, [setLoading, setError, setRow, setHasFetched]);

  useEffect(() => {
    if (!enabled) return;
    if (!hasFetched && !loading) {
      fetchAvailability();
    }
  }, [enabled, hasFetched, loading, fetchAvailability]);

  return {
    data: enabled ? row : null,
    loading: enabled ? (!hasFetched ? true : loading) : false,
    error: enabled ? error : null,
    updateFromSave,
    refetch: enabled ? fetchAvailability : async () => {},
  };
}
