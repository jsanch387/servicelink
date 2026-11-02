'use client';

import { usePublicBlockedSlots } from '@/features/availability/booking/hooks/usePublicBlockedSlots';
import type { TimeOffInterval } from '@/features/availability/booking/types';
import type { WeeklySchedule } from '@/features/availability/types/availability';
import {
  createMaintenanceAnchorDateDisabled,
  getMaintenanceSlotsForIsoDate,
} from '@/features/maintenance/utils/maintenanceAnchorSlots';
import { useCallback, useMemo } from 'react';

export function useMaintenanceAnchorSlots(params: {
  businessSlug: string;
  anchorDateIso: string;
  durationMinutes: number;
  weeklySchedule: WeeklySchedule;
  timeOffBlocks: TimeOffInterval[];
  bufferTime?: string;
  schedulingReady: boolean;
}) {
  const {
    businessSlug,
    anchorDateIso,
    durationMinutes,
    weeklySchedule,
    timeOffBlocks,
    bufferTime = 'none',
    schedulingReady,
  } = params;

  const {
    blockedSlots,
    loading: blockedLoading,
    error: blockedError,
  } = usePublicBlockedSlots(schedulingReady ? businessSlug : undefined);

  const isDateDisabled = useMemo(
    () =>
      createMaintenanceAnchorDateDisabled({
        weeklySchedule,
        durationMinutes,
        existingBookings: blockedSlots,
        timeOffBlocks,
        bufferTime,
      }),
    [weeklySchedule, durationMinutes, blockedSlots, timeOffBlocks, bufferTime]
  );

  const availableSlots = useMemo(() => {
    if (!schedulingReady || !anchorDateIso.trim()) return [];
    return getMaintenanceSlotsForIsoDate(
      anchorDateIso,
      weeklySchedule,
      durationMinutes,
      blockedSlots,
      timeOffBlocks,
      bufferTime
    );
  }, [
    schedulingReady,
    anchorDateIso,
    weeklySchedule,
    durationMinutes,
    blockedSlots,
    timeOffBlocks,
    bufferTime,
  ]);

  const pickDefaultTime = useCallback(
    (current: string, slots: string[]): string => {
      const t = current.trim().slice(0, 5);
      if (t && slots.includes(t)) return t;
      return slots[0] ?? '';
    },
    []
  );

  return {
    blockedSlots,
    blockedLoading,
    blockedError,
    isDateDisabled,
    availableSlots,
    pickDefaultTime,
  };
}
