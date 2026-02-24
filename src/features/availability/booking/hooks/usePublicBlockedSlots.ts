'use client';

import { useCallback, useEffect, useState } from 'react';
import type { ExistingBooking } from '../types';

interface UsePublicBlockedSlotsResult {
  blockedSlots: ExistingBooking[];
  loading: boolean;
  error: string | null;
}

/**
 * Fetches blocked slots for a business by slug (public booking flow).
 * Used to avoid showing already-booked times in the calendar.
 */
export function usePublicBlockedSlots(
  businessSlug: string | undefined
): UsePublicBlockedSlotsResult {
  const [blockedSlots, setBlockedSlots] = useState<ExistingBooking[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchBlocked = useCallback(async () => {
    if (!businessSlug?.trim()) {
      setBlockedSlots([]);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(
        `/api/public/bookings/blocked/${encodeURIComponent(businessSlug.trim())}`
      );
      const json = await res.json();
      if (!res.ok) {
        setError(json.error ?? 'Failed to load availability');
        setBlockedSlots([]);
        return;
      }
      if (json.success && Array.isArray(json.blockedSlots)) {
        setBlockedSlots(
          json.blockedSlots.map(
            (s: {
              date: string;
              startTime: string;
              durationMinutes: number;
            }) => ({
              date: s.date,
              startTime: s.startTime,
              durationMinutes: s.durationMinutes,
            })
          )
        );
      } else {
        setBlockedSlots([]);
      }
    } catch {
      setError('Failed to load availability');
      setBlockedSlots([]);
    } finally {
      setLoading(false);
    }
  }, [businessSlug]);

  useEffect(() => {
    fetchBlocked();
  }, [fetchBlocked]);

  return { blockedSlots, loading, error };
}
