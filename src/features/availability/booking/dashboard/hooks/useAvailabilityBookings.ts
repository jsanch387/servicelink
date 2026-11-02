'use client';

import { BOOKINGS_LIST_DEFAULT_LIMIT } from '@/features/availability/booking/constants';
import type { BookingsListFilter } from '@/features/availability/booking/server/parseListBookingsQuery';
import { API_ROUTES } from '@/constants/routes';
import { useCallback, useRef, useState, type SetStateAction } from 'react';
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
  | {
      type: 'list';
      filter: BookingsListFilter;
      asOf: string;
      assignedToMe: boolean;
    }
  | {
      type: 'range';
      from: string;
      to: string;
      assignedToMe: boolean;
    };

interface BookingsPage {
  bookings: AvailabilityBookingDisplay[];
  hasMore: boolean;
  nextCursor: string | null;
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
  const [bookings, setBookingsState] = useState<AvailabilityBookingDisplay[]>(
    []
  );
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(false);
  const [listPageIndex, setListPageIndex] = useState(0);
  const [cachedPageCount, setCachedPageCount] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const nextCursorRef = useRef<string | null>(null);
  const lastQueryRef = useRef<LastQuery | null>(null);
  const requestIdRef = useRef(0);
  const loadingMoreRef = useRef(false);
  const pagesRef = useRef<AvailabilityBookingDisplay[][]>([]);
  const pageIndexRef = useRef(0);

  const setBookings = useCallback(
    (value: SetStateAction<AvailabilityBookingDisplay[]>) => {
      setBookingsState(current => {
        const next = typeof value === 'function' ? value(current) : value;
        if (
          lastQueryRef.current?.type === 'list' &&
          pagesRef.current.length > 0
        ) {
          pagesRef.current[pageIndexRef.current] = next;
        }
        return next;
      });
    },
    []
  );

  const resetListPages = useCallback(() => {
    pagesRef.current = [];
    pageIndexRef.current = 0;
    setListPageIndex(0);
    setCachedPageCount(0);
  }, []);

  const loadListPage = useCallback(
    async (
      filter: BookingsListFilter = 'upcoming',
      options?: { assignedToMe?: boolean }
    ) => {
      const requestId = ++requestIdRef.current;
      const asOf = localDateKey(new Date());
      const assignedToMe = Boolean(options?.assignedToMe);
      lastQueryRef.current = { type: 'list', filter, asOf, assignedToMe };
      nextCursorRef.current = null;
      loadingMoreRef.current = false;
      resetListPages();
      setIsLoading(true);
      setError(null);
      setHasMore(false);
      setBookings([]);
      try {
        const params = new URLSearchParams({
          limit: String(BOOKINGS_LIST_DEFAULT_LIMIT),
          filter,
          asOf,
        });
        if (assignedToMe) params.set('assignedToMe', '1');
        const page = await fetchBookingsPage(params);
        if (requestId !== requestIdRef.current) return;
        pagesRef.current = [page.bookings];
        pageIndexRef.current = 0;
        setListPageIndex(0);
        setCachedPageCount(1);
        setBookings(page.bookings);
        setHasMore(page.hasMore);
        nextCursorRef.current = page.nextCursor;
        setError(null);
      } catch (err) {
        if (requestId !== requestIdRef.current) return;
        setError(
          err instanceof Error ? err.message : 'Failed to load bookings'
        );
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
    [resetListPages, setBookings]
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
      if (last.assignedToMe) params.set('assignedToMe', '1');
      const page = await fetchBookingsPage(params);
      if (requestId !== requestIdRef.current) return;
      const nextIndex = pagesRef.current.length;
      pagesRef.current = [...pagesRef.current, page.bookings];
      pageIndexRef.current = nextIndex;
      setListPageIndex(nextIndex);
      setCachedPageCount(pagesRef.current.length);
      setBookings(page.bookings);
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
  }, [isLoading, setBookings]);

  const loadRange = useCallback(
    async (from: string, to: string, options?: { assignedToMe?: boolean }) => {
      const requestId = ++requestIdRef.current;
      const assignedToMe = Boolean(options?.assignedToMe);
      lastQueryRef.current = { type: 'range', from, to, assignedToMe };
      nextCursorRef.current = null;
      loadingMoreRef.current = false;
      resetListPages();
      setIsLoading(true);
      setIsLoadingMore(false);
      setHasMore(false);
      setError(null);
      setBookings([]);
      try {
        const params = new URLSearchParams({ from, to });
        if (assignedToMe) params.set('assignedToMe', '1');
        const page = await fetchBookingsPage(params);
        if (requestId !== requestIdRef.current) return;
        setBookings(page.bookings);
        setHasMore(false);
        nextCursorRef.current = null;
        setError(null);
      } catch (err) {
        if (requestId !== requestIdRef.current) return;
        setError(
          err instanceof Error ? err.message : 'Failed to load bookings'
        );
        setBookings([]);
      } finally {
        if (requestId === requestIdRef.current) {
          setIsLoading(false);
        }
      }
    },
    [resetListPages, setBookings]
  );

  const setListPage = useCallback(
    async (index: number) => {
      if (index < 0 || lastQueryRef.current?.type !== 'list') return;
      const cached = pagesRef.current[index];
      if (cached) {
        pageIndexRef.current = index;
        setListPageIndex(index);
        setBookingsState(cached);
        return;
      }
      if (index === pagesRef.current.length) {
        await loadMore();
      }
    },
    [loadMore]
  );

  const refetch = useCallback(async () => {
    const last = lastQueryRef.current;
    if (last?.type === 'range') {
      await loadRange(last.from, last.to, {
        assignedToMe: last.assignedToMe,
      });
      return;
    }
    await loadListPage(last?.filter ?? 'upcoming', {
      assignedToMe: last?.assignedToMe,
    });
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
    [setBookings]
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
    [setBookings]
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
    [setBookings]
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
          data?: { assignedUserId?: string | null };
        };
        if (!res.ok || json.success === false) {
          return {
            success: false,
            error: json.error ?? 'Could not update assignee',
          };
        }
        const nextId = json.data?.assignedUserId ?? null;
        setBookings(prev =>
          prev.map(b => (b.id === id ? { ...b, assignedUserId: nextId } : b))
        );
        return { success: true };
      } catch {
        return { success: false, error: 'Could not update assignee' };
      }
    },
    [setBookings]
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
    [setBookings]
  );

  const hasNextListPage = listPageIndex < cachedPageCount - 1 || hasMore;

  return {
    bookings,
    isLoading,
    isLoadingMore,
    hasMore,
    listPageIndex,
    hasNextListPage,
    setListPage,
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
