'use client';

import { Button } from '@/components/shared';
import React from 'react';

export function PaymentsSettingsSaveRow({
  isDirty,
  saving = false,
  error,
  message,
  disabled = false,
  idleMessage = 'Nothing new to save.',
  onSave,
}: {
  isDirty: boolean;
  saving?: boolean;
  error?: string | null;
  /** Shown in place of the dirty or idle line. */
  message?: string;
  disabled?: boolean;
  idleMessage?: string;
  onSave: () => void;
}) {
  return (
    <div className="flex flex-col-reverse gap-3 sm:flex-row sm:items-center sm:justify-between">
      <p className="text-xs text-white/60 sm:max-w-xs">
        {error ? (
          <span className="text-red-300">{error}</span>
        ) : message ? (
          message
        ) : isDirty ? (
          'Save to keep your changes.'
        ) : (
          idleMessage
        )}
      </p>
      <Button
        type="button"
        variant="inverse"
        size="sm"
        disabled={disabled || !isDirty || saving}
        loading={saving}
        onClick={onSave}
        className="w-full shrink-0 sm:w-auto"
      >
        Save changes
      </Button>
    </div>
  );
}
