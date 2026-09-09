'use client';

import type { WeeklySchedule } from '@/features/availability/types/availability';
import { DEFAULT_SCHEDULE } from '@/features/availability/types/availability';
import { resolveBufferTimeValue } from '@/features/availability/utils/bufferTime';
import {
  parseStoredTimeOffBlocks,
  toTimeOffIntervalFields,
} from '@/features/availability/types/blockTime';
import type { TimeOffInterval } from '@/features/availability/booking/types';
import { useEffect, useState } from 'react';

type UseOwnerQuoteSchedulingResult = {
  weeklySchedule: WeeklySchedule;
  timeOffBlocks: TimeOffInterval[];
  bufferTime: string;
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
  const [bufferTime, setBufferTime] = useState('none');
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
          setTimeOffBlocks(parsed.map(toTimeOffIntervalFields));
          setBufferTime(resolveBufferTimeValue(json.data.buffer_time));
        } else {
          setWeeklySchedule(DEFAULT_SCHEDULE);
          setHasSavedAvailability(false);
          setTimeOffBlocks([]);
          setBufferTime('none');
        }
      } catch {
        if (!cancelled) {
          setWeeklySchedule(DEFAULT_SCHEDULE);
          setHasSavedAvailability(false);
          setTimeOffBlocks([]);
          setBufferTime('none');
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
    bufferTime,
    loading,
    hasSavedAvailability,
  };
}
