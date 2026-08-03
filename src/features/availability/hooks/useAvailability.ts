'use client';

/**
 * Loads and caches the current user's business availability.
 * - Refetches whenever the Availability screen mounts so lead time + time off
 *   always match the DB (including canonical range / all-day blocks).
 * - After save, use updateFromSave(responseData) to update cache immediately.
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
  /** Force a fresh fetch. */
  refetch: () => Promise<void>;
}

export function useAvailability(
  enabled: boolean = true
): UseAvailabilityResult {
  const row = useAvailabilityDataStore(s => s.row);
  const hasFetched = useAvailabilityDataStore(s => s.hasFetched);
  const error = useAvailabilityDataStore(s => s.error);
  const setRow = useAvailabilityDataStore(s => s.setRow);
  const setHasFetched = useAvailabilityDataStore(s => s.setHasFetched);
  const setLoading = useAvailabilityDataStore(s => s.setLoading);
  const setError = useAvailabilityDataStore(s => s.setError);
  const updateFromSave = useAvailabilityDataStore(s => s.updateFromSave);

  const fetchAvailability = useCallback(async () => {
    const isInitial = !useAvailabilityDataStore.getState().hasFetched;
    if (isInitial) setLoading(true);
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
    void fetchAvailability();
  }, [enabled, fetchAvailability]);

  return {
    data: enabled ? row : null,
    // Full-page skeleton only on the first load; remounts refresh quietly.
    loading: enabled && !hasFetched,
    error: enabled ? error : null,
    updateFromSave,
    refetch: enabled ? fetchAvailability : async () => {},
  };
}
