'use client';

import { Button, CrownIcon } from '@/components/shared';
import { ROUTES } from '@/constants/routes';
import React from 'react';
import { PAYMENTS_UPGRADE_BANNER_CARD_CLASSES } from './upgradeBannerClasses';

export interface PaymentsProTeaserBannerProps {
  title: string;
  description: string;
  className?: string;
}

/**
 * Payments-only upgrade strip: copy + primary action (shared `Button`).
 * Shown above the locked preview on free tier.
 */
export const PaymentsProTeaserBanner: React.FC<PaymentsProTeaserBannerProps> = ({
  title,
  description,
  className = '',
}) => {
  const rootClass = [PAYMENTS_UPGRADE_BANNER_CARD_CLASSES, className]
    .filter(Boolean)
    .join(' ');

  return (
    <div className={rootClass}>
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between lg:gap-8">
        <div className="min-w-0 flex-1">
          <h2 className="text-base font-semibold tracking-tight text-white sm:text-lg leading-snug">
            {title}
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
          Upgrade to Pro
        </Button>
      </div>
    </div>
  );
};
