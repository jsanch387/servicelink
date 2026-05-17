'use client';

import { Button } from '@/components/shared';
import React from 'react';

interface OnboardingStepNavProps {
  onBack: () => void;
  backDisabled?: boolean;
  /** Optional primary CTA (e.g. step 4). Omit when the main action stays in the card above. */
  children?: React.ReactNode;
}

/**
 * Go back below the step card; optional primary on the right (step 4).
 * Without children, only Go back (step 5 — Activate stays in the card).
 */
export const OnboardingStepNav: React.FC<OnboardingStepNavProps> = ({
  onBack,
  backDisabled = false,
  children,
}) => (
  <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:items-center">
    <Button
      type="button"
      variant="secondary"
      onClick={onBack}
      disabled={backDisabled}
      className="w-full sm:w-auto min-w-[140px]"
    >
      Go back
    </Button>
    {children ? (
      <div className="w-full sm:ml-auto sm:w-auto [&_button]:w-full sm:[&_button]:w-auto">
        {children}
      </div>
    ) : null}
  </div>
);
