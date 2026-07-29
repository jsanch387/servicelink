'use client';

import { Button } from '@/components/shared';
import React from 'react';

export interface CreateFlowFooterProps {
  primaryLabel: string;
  onPrimary: () => void;
  primaryDisabled?: boolean;
  secondaryLabel?: string;
  onSecondary?: () => void;
  secondaryDisabled?: boolean;
}

export function CreateFlowFooter({
  primaryLabel,
  onPrimary,
  primaryDisabled = false,
  secondaryLabel,
  onSecondary,
  secondaryDisabled = false,
}: CreateFlowFooterProps) {
  return (
    <div className="mt-8 flex flex-col-reverse gap-3 sm:flex-row sm:items-center sm:justify-between">
      {secondaryLabel && onSecondary ? (
        <Button
          type="button"
          variant="secondary"
          onClick={onSecondary}
          disabled={secondaryDisabled}
          className="w-full cursor-pointer border-0 bg-white/10 hover:border-0 hover:bg-white/15 sm:w-auto"
        >
          {secondaryLabel}
        </Button>
      ) : (
        <span className="hidden sm:block" />
      )}
      <Button
        type="button"
        variant="primary"
        onClick={onPrimary}
        disabled={primaryDisabled}
        className="w-full cursor-pointer sm:w-auto"
      >
        {primaryLabel}
      </Button>
    </div>
  );
}
