'use client';

import { toast } from '@/components/shared';
import type { BookingAssigneeOption } from '@/features/team/types/bookingAssignee';
import { ChevronDownIcon } from '@heroicons/react/24/outline';
import { useState } from 'react';

export type BookingAssigneeChangeResult = {
  success: boolean;
  error?: string;
};

interface BookingAssigneeFieldProps {
  assignedUserId: string | null;
  options: BookingAssigneeOption[];
  onAssign: (userId: string | null) => Promise<BookingAssigneeChangeResult>;
  disabled?: boolean;
}

export function BookingAssigneeField({
  assignedUserId,
  options,
  onAssign,
  disabled = false,
}: BookingAssigneeFieldProps) {
  const [saving, setSaving] = useState(false);
  const [pending, setPending] = useState<string | null>(null);
  const current = assignedUserId?.trim() || '';
  const displayValue = saving ? (pending ?? '') : current;
  const missingFromList =
    Boolean(displayValue) &&
    !options.some(option => option.userId === displayValue);

  const handleChange = async (next: string) => {
    const assignedUserId = next.trim() || null;
    setPending(assignedUserId);
    setSaving(true);
    const result = await onAssign(assignedUserId);
    if (!result.success) {
      toast.error(result.error ?? 'Could not update assignee');
    }
    setSaving(false);
    setPending(null);
  };

  return (
    <div>
      <label
        htmlFor="booking-assignee"
        className="mb-1.5 block text-xs font-medium text-gray-500"
      >
        Assignee
      </label>
      <div className="relative">
        <select
          id="booking-assignee"
          value={displayValue}
          disabled={disabled || saving}
          aria-busy={saving}
          onChange={event => {
            void handleChange(event.target.value);
          }}
          className="w-full cursor-pointer appearance-none rounded-lg border border-white/[0.09] bg-white/[0.04] py-2 pl-3 pr-9 text-sm font-medium text-white outline-none focus:border-white/[0.09] focus:outline-none focus:ring-0 disabled:cursor-not-allowed disabled:opacity-70"
        >
          <option value="">Unassigned</option>
          {missingFromList ? (
            <option value={displayValue}>Assigned</option>
          ) : null}
          {options.map(option => (
            <option key={option.userId} value={option.userId}>
              {option.label}
            </option>
          ))}
        </select>
        {saving ? (
          <span
            className="pointer-events-none absolute right-2.5 top-1/2 h-4 w-4 -translate-y-1/2"
            aria-hidden
          >
            <span className="block h-4 w-4 animate-spin rounded-full border-2 border-gray-500 border-t-white" />
          </span>
        ) : (
          <ChevronDownIcon
            className="pointer-events-none absolute right-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400"
            aria-hidden
          />
        )}
      </div>
      {saving ? <span className="sr-only">Saving assignee</span> : null}
    </div>
  );
}
