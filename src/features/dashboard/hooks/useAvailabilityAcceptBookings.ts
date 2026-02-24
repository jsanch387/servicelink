'use client';

import { useEffect, useState } from 'react';

/**
 * Returns whether the business has "Accept Bookings" (availability booking) turned on.
 * Used to show a nudge badge on the Availability nav item when off.
 */
export function useAvailabilityAcceptBookings(): {
  acceptBookings: boolean | null;
  loading: boolean;
} {
  const [acceptBookings, setAcceptBookings] = useState<boolean | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    fetch('/api/availability')
      .then(res => res.json())
      .then(json => {
        if (cancelled) return;
        const data = json?.data;
        setAcceptBookings(data?.accept_bookings === true);
      })
      .catch(() => {
        if (!cancelled) setAcceptBookings(null);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  return { acceptBookings, loading };
}
