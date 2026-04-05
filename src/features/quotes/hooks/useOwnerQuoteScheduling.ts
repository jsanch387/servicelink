'use client';

import type { WeeklySchedule } from '@/features/availability/types/availability';
import { DEFAULT_SCHEDULE } from '@/features/availability/types/availability';
import { parseStoredTimeOffBlocks } from '@/features/availability/types/blockTime';
import type { TimeOffInterval } from '@/features/availability/booking/types';
import { useEffect, useState } from 'react';

type UseOwnerQuoteSchedulingResult = {
  weeklySchedule: WeeklySchedule;
  timeOffBlocks: TimeOffInterval[];
  loading: boolean;
  /** True when a `business_availability` row returned a weekly schedule. */
  hasSavedAvailability: boolean;
};

/**
 * Loads the signed-in owner's weekly schedule and time-off blocks for quote slot picking.
 */
export function useOwnerQuoteScheduling(): UseOwnerQuoteSchedulingResult {
  const [weeklySchedule, setWeeklySchedule] =
    useState<WeeklySchedule>(DEFAULT_SCHEDULE);
  const [timeOffBlocks, setTimeOffBlocks] = useState<TimeOffInterval[]>([]);
  const [loading, setLoading] = useState(true);
  const [hasSavedAvailability, setHasSavedAvailability] = useState(false);

  useEffect(() => {
    let cancelled = false;

    (async () => {
      try {
        const res = await fetch('/api/availability');
        const json = await res.json();
        if (cancelled) return;

        if (json.success && json.data) {
          if (json.data.weekly_schedule) {
            setWeeklySchedule(json.data.weekly_schedule as WeeklySchedule);
            setHasSavedAvailability(true);
          } else {
            setWeeklySchedule(DEFAULT_SCHEDULE);
            setHasSavedAvailability(false);
          }
          const parsed = parseStoredTimeOffBlocks(json.data.time_off_blocks);
          setTimeOffBlocks(
            parsed.map(b => ({
              date: b.date,
              startTime: b.startTime,
              endTime: b.endTime,
            }))
          );
        } else {
          setWeeklySchedule(DEFAULT_SCHEDULE);
          setHasSavedAvailability(false);
          setTimeOffBlocks([]);
        }
      } catch {
        if (!cancelled) {
          setWeeklySchedule(DEFAULT_SCHEDULE);
          setHasSavedAvailability(false);
          setTimeOffBlocks([]);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  return {
    weeklySchedule,
    timeOffBlocks,
    loading,
    hasSavedAvailability,
  };
}
