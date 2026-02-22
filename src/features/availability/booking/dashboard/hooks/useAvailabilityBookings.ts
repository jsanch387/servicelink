'use client';

import { useCallback, useEffect, useState } from 'react';
import type { AvailabilityBookingDisplay } from '../types';

const API_URL = '/api/availability/bookings';

type StatusUpdate = 'completed' | 'cancelled';

/**
 * Fetches V2 bookings on every visit to the Bookings tab so the list is always fresh.
 * Mark complete / cancel still update via API and local state only (no refetch).
 */
export function useAvailabilityBookings() {
  const [bookings, setBookings] = useState<AvailabilityBookingDisplay[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchBookings = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await fetch(API_URL);
      const json = await res.json();
      if (!res.ok) {
        const err = json.error ?? 'Failed to load bookings';
        setError(err);
        setBookings([]);
        return;
      }
      const list = Array.isArray(json.data) ? json.data : [];
      setBookings(list);
      setError(null);
    } catch {
      setError('Failed to load bookings');
      setBookings([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Always fetch when the view mounts (user navigates to Bookings tab) for up-to-date data
  useEffect(() => {
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
        setBookings(prev =>
          prev.map(b => (b.id === id ? { ...b, status } : b))
        );
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
    refetch: fetchBookings,
    updateBookingStatus,
  };
}
