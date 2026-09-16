'use client';

import { BOOKINGS_LIST_DEFAULT_LIMIT } from '@/features/availability/booking/constants';
import type { BookingsListFilter } from '@/features/availability/booking/server/parseListBookingsQuery';
import { API_ROUTES } from '@/constants/routes';
import { useCallback, useRef, useState } from 'react';
import { localDateKey } from '../dayPlannerUtils';
import type { AvailabilityBookingDisplay } from '../types';
import type { WebCompletePaymentMethod } from '../utils/webCompletePaymentMethods';

const API_URL = API_ROUTES.AVAILABILITY_BOOKINGS;

type StatusUpdate = 'completed' | 'cancelled';

export type RescheduleBookingResult =
  | { success: true; booking: AvailabilityBookingDisplay }
  | { success: false; error: string };

export interface CompleteBookingJobArgs {
  id: string;
  sessionPayment?: {
    method: WebCompletePaymentMethod;
    amountCents: number;
  };
}

type LastQuery =
  | { type: 'list'; filter: BookingsListFilter; asOf: string }
  | { type: 'range'; from: string; to: string };

interface BookingsPage {
  bookings: AvailabilityBookingDisplay[];
  hasMore: boolean;
  nextCursor: string | null;
}

function mergeBookings(
  current: AvailabilityBookingDisplay[],
  incoming: AvailabilityBookingDisplay[]
): AvailabilityBookingDisplay[] {
  const seen = new Set(current.map(booking => booking.id));
  return [...current, ...incoming.filter(booking => !seen.has(booking.id))];
}

async function fetchBookingsPage(
  params: URLSearchParams
): Promise<BookingsPage> {
  const res = await fetch(`${API_URL}?${params.toString()}`);
  const json = (await res.json()) as {
    success?: boolean;
    error?: string;
    data?: AvailabilityBookingDisplay[];
    hasMore?: boolean;
    nextCursor?: string | null;
  };
  if (!res.ok) {
    throw new Error(json.error ?? 'Failed to load bookings');
  }
  return {
    bookings: Array.isArray(json.data) ? json.data : [],
    hasMore: Boolean(json.hasMore),
    nextCursor: json.nextCursor ?? null,
  };
}

/**
 * Loads bookings in pages (list) or a visible date window (calendar).
 * Status updates still patch local state only.
 */
export function useAvailabilityBookings() {
  const [bookings, setBookings] = useState<AvailabilityBookingDisplay[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const nextCursorRef = useRef<string | null>(null);
  const lastQueryRef = useRef<LastQuery | null>(null);
  const requestIdRef = useRef(0);
  const loadingMoreRef = useRef(false);

  const loadListPage = useCallback(
    async (filter: BookingsListFilter = 'upcoming') => {
      const requestId = ++requestIdRef.current;
      const asOf = localDateKey(new Date());
      lastQueryRef.current = { type: 'list', filter, asOf };
      nextCursorRef.current = null;
      loadingMoreRef.current = false;
      setIsLoading(true);
      setError(null);
      setHasMore(false);
      setBookings([]);
      try {
        const page = await fetchBookingsPage(
          new URLSearchParams({
            limit: String(BOOKINGS_LIST_DEFAULT_LIMIT),
            filter,
            asOf,
          })
        );
        if (requestId !== requestIdRef.current) return;
        setBookings(page.bookings);
        setHasMore(page.hasMore);
        nextCursorRef.current = page.nextCursor;
        setError(null);
      } catch (err) {
        if (requestId !== requestIdRef.current) return;
        setError(err instanceof Error ? err.message : 'Failed to load bookings');
        setBookings([]);
        setHasMore(false);
        nextCursorRef.current = null;
      } finally {
        if (requestId === requestIdRef.current) {
          setIsLoading(false);
          setIsLoadingMore(false);
        }
      }
    },
    []
  );

  const loadMore = useCallback(async () => {
    const cursor = nextCursorRef.current;
    const last = lastQueryRef.current;
    if (
      !cursor ||
      last?.type !== 'list' ||
      loadingMoreRef.current ||
      isLoading
    ) {
      return;
    }
    loadingMoreRef.current = true;
    const requestId = ++requestIdRef.current;
    setIsLoadingMore(true);
    setError(null);
    try {
      const params = new URLSearchParams({
        limit: String(BOOKINGS_LIST_DEFAULT_LIMIT),
        cursor,
        filter: last.filter,
        asOf: last.asOf,
      });
      const page = await fetchBookingsPage(params);
      if (requestId !== requestIdRef.current) return;
      setBookings(current => mergeBookings(current, page.bookings));
      setHasMore(page.hasMore);
      nextCursorRef.current = page.nextCursor;
    } catch (err) {
      if (requestId !== requestIdRef.current) return;
      setError(err instanceof Error ? err.message : 'Failed to load bookings');
    } finally {
      if (requestId === requestIdRef.current) {
        loadingMoreRef.current = false;
        setIsLoadingMore(false);
      }
    }
  }, [isLoading]);

  const loadRange = useCallback(async (from: string, to: string) => {
    const requestId = ++requestIdRef.current;
    lastQueryRef.current = { type: 'range', from, to };
    nextCursorRef.current = null;
    loadingMoreRef.current = false;
    setIsLoading(true);
    setIsLoadingMore(false);
    setHasMore(false);
    setError(null);
    setBookings([]);
    try {
      const params = new URLSearchParams({ from, to });
      const page = await fetchBookingsPage(params);
      if (requestId !== requestIdRef.current) return;
      setBookings(page.bookings);
      setHasMore(false);
      nextCursorRef.current = null;
      setError(null);
    } catch (err) {
      if (requestId !== requestIdRef.current) return;
      setError(err instanceof Error ? err.message : 'Failed to load bookings');
      setBookings([]);
    } finally {
      if (requestId === requestIdRef.current) {
        setIsLoading(false);
      }
    }
  }, []);

  const refetch = useCallback(async () => {
    const last = lastQueryRef.current;
    if (last?.type === 'range') {
      await loadRange(last.from, last.to);
      return;
    }
    await loadListPage(last?.filter ?? 'upcoming');
  }, [loadListPage, loadRange]);

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

  /**
   * Complete via `job_completed` (same as mobile): records offline collection,
   * invoice, and status. Web never sends `tap_to_pay`.
   */
  const completeBookingJob = useCallback(
    async (
      args: CompleteBookingJobArgs
    ): Promise<{ success: boolean; error?: string }> => {
      const { id, sessionPayment } = args;
      try {
        const body: {
          action: 'job_completed';
          sessionFees: [];
          sessionPayment?: {
            method: WebCompletePaymentMethod;
            amountCents: number;
          };
        } = {
          action: 'job_completed',
          sessionFees: [],
        };
        if (sessionPayment) {
          body.sessionPayment = {
            method: sessionPayment.method,
            amountCents: sessionPayment.amountCents,
          };
        }

        const res = await fetch(`${API_URL}/${id}/actions`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(body),
        });
        const json = (await res.json()) as {
          success?: boolean;
          error?: string;
        };
        if (!res.ok || json.success === false) {
          return {
            success: false,
            error: json.error ?? 'Failed to complete booking',
          };
        }
        setBookings(prev =>
          prev.map(b => (b.id === id ? { ...b, status: 'completed' } : b))
        );
        return { success: true };
      } catch {
        return { success: false, error: 'Failed to complete booking' };
      }
    },
    []
  );

  const rescheduleBooking = useCallback(
    async (
      id: string,
      scheduledDate: string,
      startTime: string
    ): Promise<RescheduleBookingResult> => {
      try {
        const res = await fetch(`${API_URL}/${id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            scheduledDate: scheduledDate.trim(),
            startTime: startTime.trim(),
          }),
        });
        const json = (await res.json()) as {
          success?: boolean;
          error?: string;
          data?: AvailabilityBookingDisplay;
        };
        if (!res.ok || !json.success || !json.data) {
          return {
            success: false,
            error: json.error ?? 'Could not reschedule this appointment',
          };
        }
        const booking = json.data;
        setBookings(prev => prev.map(b => (b.id === id ? booking : b)));
        return { success: true, booking };
      } catch {
        return {
          success: false,
          error: 'Could not reschedule this appointment',
        };
      }
    },
    []
  );

  const updateBookingAssignee = useCallback(
    async (
      id: string,
      assignedUserId: string | null
    ): Promise<{ success: boolean; error?: string }> => {
      try {
        const res = await fetch(API_ROUTES.availabilityBookingAssignee(id), {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ assignedUserId }),
        });
        const json = (await res.json()) as {
          success?: boolean;
          error?: string;
          assignedUserId?: string | null;
        };
        if (!res.ok || json.success === false) {
          return {
            success: false,
            error: json.error ?? 'Could not update assignee',
          };
        }
        const nextId =
          typeof json.assignedUserId === 'string'
            ? json.assignedUserId
            : (json.assignedUserId ?? null);
        setBookings(prev =>
          prev.map(b => (b.id === id ? { ...b, assignedUserId: nextId } : b))
        );
        return { success: true };
      } catch {
        return { success: false, error: 'Could not update assignee' };
      }
    },
    []
  );

  const deleteBooking = useCallback(
    async (id: string): Promise<{ success: boolean; error?: string }> => {
      try {
        const res = await fetch(`${API_URL}/${id}`, { method: 'DELETE' });
        const json = (await res.json().catch(() => ({}))) as {
          success?: boolean;
          error?: string;
        };
        if (!res.ok || json.success === false) {
          return {
            success: false,
            error: json.error ?? 'Failed to delete booking',
          };
        }
        setBookings(prev => prev.filter(b => b.id !== id));
        return { success: true };
      } catch {
        return { success: false, error: 'Failed to delete booking' };
      }
    },
    []
  );

  return {
    bookings,
    isLoading,
    isLoadingMore,
    hasMore,
    error,
    loadListPage,
    loadMore,
    loadRange,
    refetch,
    updateBookingStatus,
    completeBookingJob,
    rescheduleBooking,
    updateBookingAssignee,
    deleteBooking,
  };
}
