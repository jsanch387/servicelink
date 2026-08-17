'use client';

import { Button, CrownIcon } from '@/components/shared';
import { ROUTES } from '@/constants/routes';
import { PAYMENTS_UPGRADE_BANNER_CARD_CLASSES } from '@/features/payments/free-payment-preview/upgradeBannerClasses';
import React from 'react';

interface SubscriptionsProPausedBannerProps {
  activeMemberCount: number;
  className?: string;
}

/**
 * Shown when the owner lost Pro but still has memberships.
 * Existing members keep billing; new public signups stay paused.
 */
export const SubscriptionsProPausedBanner: React.FC<
  SubscriptionsProPausedBannerProps
> = ({ activeMemberCount, className = '' }) => {
  const count = Math.max(0, Math.floor(activeMemberCount));
  const description =
    count === 1
      ? '1 active member still billing; new signups paused until Pro is restored. You can still manage existing members.'
      : count > 1
        ? `${count} active members still billing; new signups paused until Pro is restored. You can still manage existing members.`
        : 'New signups paused until Pro is restored. Existing members keep their plans; you can still manage them here.';

  const rootClass = [PAYMENTS_UPGRADE_BANNER_CARD_CLASSES, className]
    .filter(Boolean)
    .join(' ');

  return (
    <div className={rootClass}>
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between lg:gap-8">
        <div className="min-w-0 flex-1">
          <h2 className="text-base font-semibold leading-snug tracking-tight text-white sm:text-lg">
            New signups paused
          </h2>
          <p className="mt-2 text-sm leading-relaxed text-gray-400 sm:max-w-2xl">
            {description}
          </p>
        </div>
        <Button
          href={ROUTES.DASHBOARD.UPGRADE}
          variant="inverse"
          size="sm"
          icon={<CrownIcon className="h-4 w-4 text-black" aria-hidden />}
          iconPosition="left"
          className="w-full shrink-0 whitespace-nowrap sm:w-auto"
        >
          Restore Pro
        </Button>
      </div>
    </div>
  );
};
