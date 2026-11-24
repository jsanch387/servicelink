'use client';

import { Button } from '@/components/shared';
import { bookingV2ColumnClass } from '../bookingV2Column';

/** Sticky date, price, and Continue bar shared by the later booking steps. */
export function BookingV2ContinueFooter({
  primary,
  secondary,
  continueLabel,
  disabled = false,
  onContinue,
}: {
  primary: string;
  secondary: string;
  continueLabel: string;
  disabled?: boolean;
  onContinue?: () => void;
}) {
  return (
    <div className="fixed inset-x-0 bottom-0 z-20 bg-[#0F0F0F]">
      <div
        className={`${bookingV2ColumnClass} flex items-center justify-between gap-4 border-t border-[#222222] px-5 pb-[max(34px,env(safe-area-inset-bottom))] pt-3.5`}
      >
        <div className="min-w-0">
          <p className="text-[16px] font-semibold leading-5 text-white">
            {primary}
          </p>
          <p className="text-[13px] font-normal text-[#8F8F8F]">{secondary}</p>
        </div>
        <Button
          type="button"
          variant="primary"
          size="md"
          className="shrink-0"
          disabled={disabled}
          onClick={onContinue}
        >
          {continueLabel}
        </Button>
      </div>
    </div>
  );
}
