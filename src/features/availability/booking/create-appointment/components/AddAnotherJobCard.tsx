'use client';

import { PlusIcon } from '@heroicons/react/24/outline';
import React from 'react';

export interface AddAnotherJobCardProps {
  onPress: () => void;
  disabled?: boolean;
  label?: string;
}

export function AddAnotherJobCard({
  onPress,
  disabled = false,
  label = 'Add another job',
}: AddAnotherJobCardProps) {
  return (
    <button
      type="button"
      onClick={onPress}
      disabled={disabled}
      aria-label="Add another job to this visit"
      className={`flex w-full cursor-pointer items-center justify-center gap-2 rounded-2xl border border-dashed border-white/25 bg-white/[0.03] px-4 py-4 text-sm font-semibold text-white transition-colors hover:border-white/40 hover:bg-white/[0.06] disabled:cursor-not-allowed disabled:opacity-45 ${disabled ? '' : ''}`}
    >
      <PlusIcon className="h-5 w-5 shrink-0" aria-hidden />
      {label}
    </button>
  );
}
