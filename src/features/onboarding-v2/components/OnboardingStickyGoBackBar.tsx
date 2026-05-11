'use client';

import { Button } from '@/components/shared';
import React from 'react';

/** Bottom safe area + bar height so scroll content clears the fixed footer. */
export const ONBOARDING_STICKY_BACK_BAR_PAD_CLASS = 'pb-28 sm:pb-24';

interface OnboardingStickyGoBackBarProps {
  onBack: () => void;
  disabled?: boolean;
}

export const OnboardingStickyGoBackBar: React.FC<
  OnboardingStickyGoBackBarProps
> = ({ onBack, disabled }) => {
  return (
    <div className="fixed inset-x-0 bottom-0 z-30 border-t border-white/10 bg-[var(--dashboard-bg)]/95 px-4 pt-3 pb-[max(1rem,env(safe-area-inset-bottom))] backdrop-blur-sm sm:px-6 lg:px-8">
      <div className="mx-auto flex max-w-2xl justify-start">
        <Button
          type="button"
          variant="secondary"
          onClick={onBack}
          disabled={disabled}
          className="w-full sm:w-auto min-w-[140px]"
        >
          Go back
        </Button>
      </div>
    </div>
  );
};
