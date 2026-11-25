'use client';

import { Button, CrownIcon } from '@/components/shared';
import { ROUTES } from '@/constants/routes';
import React from 'react';

export function AssistantProTeaserModalBody({
  onClose,
}: {
  onClose: () => void;
}) {
  return (
    <div className="space-y-4">
      <p className="text-base font-semibold leading-snug text-white">
        Unlock Assistant with Pro
      </p>
      <p className="text-sm leading-relaxed text-gray-300">
        See who needs a review or check-in, send texts with your approval, and
        ask about revenue, schedule, customers, and your menu — all from one
        place.
      </p>
      <div className="flex flex-col-reverse gap-2 pt-1 sm:flex-row sm:justify-end">
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
}
