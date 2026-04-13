'use client';

import { Button, GlassCard } from '@/components/shared';
import { ROUTES } from '@/constants/routes';
import { MOCK_AVAILABLE_BALANCE_CENTS } from '@/features/payments/data/mockPayments';
import { formatPaymentCents } from '@/features/payments/utils/formatPaymentMoney';
import {
  ArrowTopRightOnSquareIcon,
  CogIcon,
} from '@heroicons/react/24/outline';
import React from 'react';

const STRIPE_DASHBOARD_URL = 'https://dashboard.stripe.com';

export interface PaymentsBalanceAndStripeSectionProps {
  /** When false, hides the Stripe dashboard card (e.g. free-tier preview). Default true. */
  showStripeDashboardCard?: boolean;
}

export const PaymentsBalanceAndStripeSection: React.FC<
  PaymentsBalanceAndStripeSectionProps
> = ({ showStripeDashboardCard = true }) => {
  return (
    <div
      className={
        showStripeDashboardCard
          ? 'grid gap-4 sm:gap-6 lg:grid-cols-2'
          : 'grid gap-4 sm:gap-6'
      }
    >
      <GlassCard padding="none" rounded="rounded-2xl" className="p-4 sm:p-8">
        <p className="text-sm font-medium text-gray-400">Available balance</p>
        <p className="mt-2 text-3xl sm:text-4xl font-bold tracking-tight text-white tabular-nums">
          {formatPaymentCents(MOCK_AVAILABLE_BALANCE_CENTS)}
        </p>
        <p className="mt-3 text-xs text-gray-500">
          From your Stripe balance.
        </p>
      </GlassCard>

      {showStripeDashboardCard ? (
        <GlassCard padding="none" rounded="rounded-2xl" className="p-4 sm:p-8">
          <p className="text-sm font-semibold text-white">Stripe</p>
          <p className="mt-1 text-sm text-gray-400 leading-relaxed">
            See charges, payouts, and tax forms. Bank info stays in Settings.
          </p>
          <div className="mt-5 flex flex-col sm:flex-row gap-3">
            <Button
              href={STRIPE_DASHBOARD_URL}
              variant="secondary"
              size="sm"
              icon={<ArrowTopRightOnSquareIcon className="h-4 w-4" />}
              iconPosition="right"
              className="sm:flex-1"
            >
              Open Stripe Dashboard
            </Button>
            <Button
              href={ROUTES.DASHBOARD.SETTINGS}
              variant="ghost"
              size="sm"
              icon={<CogIcon className="h-4 w-4" />}
              className="sm:shrink-0"
            >
              Settings
            </Button>
          </div>
        </GlassCard>
      ) : null}
    </div>
  );
};
