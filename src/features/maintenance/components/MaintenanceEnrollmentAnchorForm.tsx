'use client';

import { Button, ScheduleDatePickerField } from '@/components/shared';
import type { TimeOffInterval } from '@/features/availability/booking/types';
import type { WeeklySchedule } from '@/features/availability/types/availability';
import { MaintenanceAvailableTimeSelect } from '@/features/maintenance/components/MaintenanceAvailableTimeSelect';
import { useMaintenanceAnchorSlots } from '@/features/maintenance/hooks/useMaintenanceAnchorSlots';
import { maintenanceAnchorMinSelectableDate } from '@/features/maintenance/utils/maintenanceAnchorDate';
import { useRouter } from 'next/navigation';
import { useEffect, useMemo, useState } from 'react';

interface MaintenanceEnrollmentAnchorFormProps {
  token: string;
  businessSlug: string;
  businessDisplayName: string;
  durationMinutes: number;
  weeklySchedule: WeeklySchedule;
  timeOffBlocks: TimeOffInterval[];
  /** Owner has saved weekly hours (server anchor save requires this). */
  schedulingReady: boolean;
}

export function MaintenanceEnrollmentAnchorForm({
  token,
  businessSlug,
  businessDisplayName,
  durationMinutes,
  weeklySchedule,
  timeOffBlocks,
  schedulingReady,
}: MaintenanceEnrollmentAnchorFormProps) {
  const router = useRouter();
  const [anchorDate, setAnchorDate] = useState('');
  const [anchorTime, setAnchorTime] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const minAnchorDate = useMemo(() => maintenanceAnchorMinSelectableDate(), []);

  const {
    blockedLoading,
    blockedError,
    isDateDisabled,
    availableSlots,
    pickDefaultTime,
  } = useMaintenanceAnchorSlots({
    businessSlug,
    anchorDateIso: anchorDate,
    durationMinutes,
    weeklySchedule,
    timeOffBlocks,
    schedulingReady,
  });

  useEffect(() => {
    if (!anchorDate.trim()) {
      setAnchorTime('');
      return;
    }
    setAnchorTime(prev => pickDefaultTime(prev, availableSlots));
  }, [anchorDate, availableSlots, pickDefaultTime]);

  const save = async () => {
    if (loading) return;
    setError(null);
    setLoading(true);
    try {
      const res = await fetch('/api/public/maintenance-enrollment/anchor', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          token,
          anchorDate: anchorDate.trim(),
          anchorTime: anchorTime.trim().slice(0, 5),
        }),
      });
      const json = (await res.json()) as { success?: boolean; error?: string };
      if (!res.ok || !json.success) {
        setError(json.error || 'Could not save. Please try again.');
        return;
      }
      router.refresh();
    } catch {
      setError('Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const hasDate = anchorDate.trim() !== '';
  const timeReady =
    anchorTime.trim() !== '' && availableSlots.includes(anchorTime.trim());
  const canSave =
    schedulingReady && hasDate && timeReady && !loading && !blockedLoading;

  if (!schedulingReady) {
    return (
      <p className="text-sm leading-relaxed text-gray-400">
        {businessDisplayName} has not set up online scheduling yet. Contact them
        to choose your visit time.
      </p>
    );
  }

  return (
    <div className="space-y-3">
      <p className="text-sm text-gray-400">
        No date chosen yet. Pick an open date and time for your maintenance
        detail.
      </p>
      {blockedError ? (
        <p className="text-sm text-amber-300/90" role="status">
          Could not load the calendar. Refresh the page or try again in a
          moment.
        </p>
      ) : null}
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="min-w-0 sm:col-span-2">
          <ScheduleDatePickerField
            id="maint-anchor-date"
            value={anchorDate}
            onChange={setAnchorDate}
            minDate={minAnchorDate}
            isDateDisabled={isDateDisabled}
            aria-label="Maintenance visit date"
          />
        </div>
        <div className="min-w-0 sm:col-span-2">
          <label
            htmlFor="maint-anchor-time"
            className="mb-1.5 block text-xs font-medium text-gray-400"
          >
            Preferred time
          </label>
          <MaintenanceAvailableTimeSelect
            id="maint-anchor-time"
            value={anchorTime}
            onChange={setAnchorTime}
            availableSlots={availableSlots}
            loading={blockedLoading}
            disabled={!hasDate}
            aria-label="Preferred visit time"
          />
        </div>
      </div>
      {error ? (
        <p className="text-sm text-red-300" role="alert">
          {error}
        </p>
      ) : null}
      <Button
        type="button"
        variant="secondary"
        size="sm"
        fullWidth
        loading={loading}
        disabled={!canSave || loading}
        onClick={() => void save()}
      >
        Save date
      </Button>
    </div>
  );
}
