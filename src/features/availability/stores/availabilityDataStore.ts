'use client';

import { create } from 'zustand';
import type { BusinessAvailabilityRow } from '../types/availability';

/**
 * Caches the current user's business availability from the API.
 * - Fetch once per session; reuse when revisiting the availability page.
 * - After save, update cache from POST response (no refetch).
 */

interface AvailabilityDataState {
  /** Fetched or saved row; null means "no availability set up yet". */
  row: BusinessAvailabilityRow | null;
  /** True after first successful fetch (so we don't refetch on every mount). */
  hasFetched: boolean;
  loading: boolean;
  error: string | null;
  setRow: (row: BusinessAvailabilityRow | null) => void;
  setHasFetched: (value: boolean) => void;
  setLoading: (value: boolean) => void;
  setError: (value: string | null) => void;
  /** Call after successful POST save to update cache without refetching. */
  updateFromSave: (row: BusinessAvailabilityRow) => void;
  /** Clear cache (e.g. on logout if needed later). */
  reset: () => void;
}

const initialState = {
  row: null,
  hasFetched: false,
  loading: false,
  error: null,
};

export const useAvailabilityDataStore = create<AvailabilityDataState>()(
  set => ({
    ...initialState,
    setRow: row => set({ row }),
    setHasFetched: hasFetched => set({ hasFetched }),
    setLoading: loading => set({ loading }),
    setError: error => set({ error }),
    updateFromSave: row => set({ row, error: null, hasFetched: true }),
    reset: () => set(initialState),
  })
);
