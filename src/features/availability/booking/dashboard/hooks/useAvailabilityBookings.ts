'use client';

import { useCallback, useEffect, useState } from 'react';
import type { AvailabilityBookingDisplay } from '../types';

const API_URL = '/api/availability/bookings';

type StatusUpdate = 'completed' | 'cancelled';

/** Module-level cache so we only make one request per mount (avoids duplicate calls from Strict Mode or re-mounts). */
let sharedPromise: Promise<void> | null = null;
let sharedCache: {
  bookings: AvailabilityBookingDisplay[];
  error: string | null;
} | null = null;

export function useAvailabilityBookings() {
  const [bookings, setBookings] = useState<AvailabilityBookingDisplay[]>(
    () => sharedCache?.bookings ?? []
  );
  const [isLoading, setIsLoading] = useState(() => !sharedCache);
  const [error, setError] = useState<string | null>(
    () => sharedCache?.error ?? null
  );

  const fetchBookings = useCallback(async (bypassCache = false) => {
    if (!bypassCache && sharedPromise) {
      await sharedPromise;
      if (sharedCache) {
        setBookings(sharedCache.bookings);
        setError(sharedCache.error);
      }
      setIsLoading(false);
      return;
    }
    if (bypassCache) {
      sharedCache = null;
      sharedPromise = null;
    }
    setIsLoading(true);
    setError(null);
    sharedPromise = (async () => {
      try {
        const res = await fetch(API_URL);
        const json = await res.json();
        if (!res.ok) {
          const err = json.error ?? 'Failed to load bookings';
          sharedCache = { bookings: [], error: err };
          setError(err);
          setBookings([]);
          return;
        }
        const list = Array.isArray(json.data) ? json.data : [];
        sharedCache = { bookings: list, error: null };
        setBookings(list);
        setError(null);
      } catch {
        sharedCache = { bookings: [], error: 'Failed to load bookings' };
        setError('Failed to load bookings');
        setBookings([]);
      } finally {
        setIsLoading(false);
        sharedPromise = null;
      }
    })();
    await sharedPromise;
  }, []);

  useEffect(() => {
    if (sharedCache) {
      setBookings(sharedCache.bookings);
      setError(sharedCache.error);
      setIsLoading(false);
      return;
    }
    fetchBookings();
  }, [fetchBookings]);

  const updateBookingStatus = useCallback(
    async (
      id: string,
      status: StatusUpdate
    ): Promise<{ success: boolean; error?: string }> => {
      try {
        const res = await fetch(`${API_URL}/${id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ status }),
        });
        const json = await res.json();
        if (!res.ok) {
          return {
            success: false,
            error: json.error ?? 'Failed to update booking',
          };
        }
        const nextBookings = (prev: AvailabilityBookingDisplay[]) =>
          prev.map(b => (b.id === id ? { ...b, status } : b));
        setBookings(nextBookings);
        if (sharedCache) {
          sharedCache = {
            bookings: nextBookings(sharedCache.bookings),
            error: sharedCache.error,
          };
        }
        return { success: true };
      } catch {
        return { success: false, error: 'Failed to update booking' };
      }
    },
    []
  );

  return {
    bookings,
    isLoading,
    error,
    refetch: () => fetchBookings(true),
    updateBookingStatus,
  };
}
