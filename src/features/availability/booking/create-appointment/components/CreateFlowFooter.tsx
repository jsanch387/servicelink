'use client';

import { Button } from '@/components/shared';
import React from 'react';

export interface CreateFlowFooterProps {
  primaryLabel: string;
  onPrimary: () => void;
  primaryDisabled?: boolean;
  primaryLoading?: boolean;
  secondaryLabel?: string;
  onSecondary?: () => void;
  secondaryDisabled?: boolean;
}

export function CreateFlowFooter({
  primaryLabel,
  onPrimary,
  primaryDisabled = false,
  primaryLoading = false,
  secondaryLabel,
  onSecondary,
  secondaryDisabled = false,
}: CreateFlowFooterProps) {
  const hasSecondary = Boolean(secondaryLabel && onSecondary);

  return (
    <div
      className={`mt-8 grid gap-3 ${
        hasSecondary ? 'grid-cols-1 sm:grid-cols-2' : 'grid-cols-1'
      }`}
    >
      {hasSecondary ? (
        <Button
          type="button"
          variant="secondary"
          onClick={onSecondary}
          disabled={secondaryDisabled || primaryLoading}
          fullWidth
          className="order-2 sm:order-1"
        >
          {secondaryLabel}
        </Button>
      ) : null}
      <Button
        type="button"
        variant="primary"
        onClick={onPrimary}
        disabled={primaryDisabled}
        loading={primaryLoading}
        fullWidth
        className={`cursor-pointer ${hasSecondary ? 'order-1 sm:order-2' : ''}`}
      >
        {primaryLabel}
      </Button>
    </div>
  );
}
