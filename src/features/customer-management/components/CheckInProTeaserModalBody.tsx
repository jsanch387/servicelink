'use client';

import { Button, CrownIcon } from '@/components/shared';
import { ROUTES } from '@/constants/routes';
import React from 'react';

interface CheckInProTeaserModalBodyProps {
  onClose: () => void;
}

export const CheckInProTeaserModalBody: React.FC<
  CheckInProTeaserModalBodyProps
> = ({ onClose }) => {
  return (
    <div className="space-y-4">
      <p className="text-base font-semibold text-white leading-snug">
        Want to save hours of manual texting?
      </p>
      <p className="text-sm text-gray-300 leading-relaxed">
        Pro members tap once to open Messages with a ready-to-send check-in and
        your booking link—no copying phone numbers, jumping between apps, or
        retyping the same message for every customer.
      </p>
      <div className="flex flex-col-reverse sm:flex-row gap-2 sm:justify-end pt-1">
        <Button
          variant="ghost"
          size="sm"
          type="button"
          onClick={onClose}
          className="sm:order-2"
        >
          Not now
        </Button>
        <Button
          variant="inverse"
          size="sm"
          href={ROUTES.DASHBOARD.UPGRADE}
          className="sm:order-1"
          icon={<CrownIcon className="h-4 w-4" />}
        >
          Upgrade to Pro
        </Button>
      </div>
    </div>
  );
};
