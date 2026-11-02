'use client';

import { API_ROUTES } from '@/constants/routes';
import {
  addDaysToDateKey,
  localDateKey,
} from '@/features/availability/booking/dashboard/dayPlannerUtils';
import type { AvailabilityBookingDisplay } from '@/features/availability/booking/dashboard/types';
import { bookingListServiceTitle } from '@/features/availability/booking/dashboard/utils/bookingCardServiceTitle';
import { formatListCardTimeForBooking } from '@/features/availability/booking/dashboard/utils/formatListCardTime';
import { useCallback, useEffect, useState } from 'react';

export interface DashboardScheduleVisit {
  id: string;
  day: string;
  time: string;
  customer: string;
  service: string;
}

export function useDashboardSchedule() {
  const [visits, setVisits] = useState<DashboardScheduleVisit[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [reloadKey, setReloadKey] = useState(0);

  const reload = useCallback(() => setReloadKey(key => key + 1), []);

  useEffect(() => {
    const today = localDateKey(new Date());
    const tomorrow = addDaysToDateKey(today, 1);
    let cancelled = false;

    setLoading(true);
    setError(null);

    void loadSchedule(today, tomorrow)
      .then(visits => {
        if (!cancelled) setVisits(visits);
      })
      .catch((err: unknown) => {
        if (cancelled) return;
        setVisits([]);
        setError(
          err instanceof Error ? err.message : "Couldn't load upcoming jobs."
        );
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [reloadKey]);

  return { visits, loading, error, reload };
}

async function loadSchedule(
  today: string,
  tomorrow: string
): Promise<DashboardScheduleVisit[]> {
  const nearby = await fetchBookings(
    new URLSearchParams({ from: today, to: tomorrow })
  );
  const visits = toVisits(nearby, today, tomorrow).filter(
    visit => visit.day === 'Today' || visit.day === 'Tomorrow'
  );
  if (visits.length > 0) return visits;

  const upcoming = await fetchBookings(
    new URLSearchParams({
      filter: 'upcoming',
      asOf: today,
      limit: '1',
    })
  );
  return toVisits(upcoming, today, tomorrow).slice(0, 1);
}

async function fetchBookings(
  params: URLSearchParams
): Promise<AvailabilityBookingDisplay[]> {
  const response = await fetch(
    `${API_ROUTES.AVAILABILITY_BOOKINGS}?${params.toString()}`
  );
  const body = (await response.json().catch(() => ({}))) as {
    success?: boolean;
    error?: string;
    data?: AvailabilityBookingDisplay[];
  };
  if (!response.ok || body.success === false) {
    throw new Error(
      typeof body.error === 'string' && body.error.trim()
        ? body.error
        : "Couldn't load upcoming jobs."
    );
  }
  return body.data ?? [];
}

function toVisits(
  bookings: AvailabilityBookingDisplay[],
  today: string,
  tomorrow: string
): DashboardScheduleVisit[] {
  return bookings.flatMap(booking => {
    if (booking.status !== 'confirmed' || !booking.date) return [];
    return [
      {
        id: booking.id,
        day: dayLabel(booking.date, today, tomorrow),
        time: formatListCardTimeForBooking(booking),
        customer: booking.customerName.trim() || 'Customer',
        service: bookingListServiceTitle(booking),
      },
    ];
  });
}

function dayLabel(date: string, today: string, tomorrow: string): string {
  if (date === today) return 'Today';
  if (date === tomorrow) return 'Tomorrow';
  return new Date(`${date}T12:00:00`).toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
  });
}
