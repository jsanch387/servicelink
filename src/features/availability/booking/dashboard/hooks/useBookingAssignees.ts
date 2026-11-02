'use client';

import { API_ROUTES } from '@/constants/routes';
import type { BookingAssigneeOption } from '@/features/team/types/bookingAssignee';
import { useCallback, useEffect, useState } from 'react';

export function useBookingAssignees() {
  const [assignees, setAssignees] = useState<BookingAssigneeOption[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchAssignees = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await fetch(API_ROUTES.AVAILABILITY_BOOKING_ASSIGNEES);
      const json = (await res.json()) as {
        success?: boolean;
        assignees?: BookingAssigneeOption[];
      };
      if (!res.ok || !Array.isArray(json.assignees)) {
        setAssignees([]);
        return;
      }
      setAssignees(json.assignees);
    } catch {
      setAssignees([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    void fetchAssignees();
  }, [fetchAssignees]);

  return { assignees, isLoading, refetch: fetchAssignees };
}
