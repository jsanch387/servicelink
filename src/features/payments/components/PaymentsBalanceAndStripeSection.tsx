'use client';

import { Button, GlassCard } from '@/components/shared';
import { API_ROUTES } from '@/constants/routes';
import { ArrowTopRightOnSquareIcon } from '@heroicons/react/24/outline';
import React, { useCallback, useState } from 'react';

const STRIPE_MARKETING_FALLBACK = 'https://dashboard.stripe.com';

export interface PaymentsBalanceAndStripeSectionProps {
  /**
   * Connected account id (`acct_…`). When set, “Open Stripe Dashboard” mints
   * an Express Dashboard login link for that account.
   */
  stripeExpressAccountId?: string | null;
}

/**
 * Stripe Express dashboard entry (v1). In-app balance was removed for v1;
 * owners see balance in Stripe until a live balance API is wired.
 */
export const PaymentsBalanceAndStripeSection: React.FC<
  PaymentsBalanceAndStripeSectionProps
> = ({ stripeExpressAccountId = null }) => {
  const [opening, setOpening] = useState(false);
  const [openError, setOpenError] = useState<string | null>(null);

  const openExpressDashboard = useCallback(async () => {
    if (!stripeExpressAccountId?.trim() || opening) return;
    setOpenError(null);
    setOpening(true);
    try {
      const res = await fetch(API_ROUTES.STRIPE_CONNECT_EXPRESS_DASHBOARD, {
        method: 'POST',
      });
      const data = (await res.json().catch(() => ({}))) as {
        success?: boolean;
        url?: string;
        error?: string;
      };

      if (!res.ok || data.success === false || typeof data.url !== 'string') {
        setOpenError(
          typeof data.error === 'string' && data.error.trim()
            ? data.error
            : 'Could not open Stripe. Try again.'
        );
        return;
      }

      const opened = window.open(data.url, '_blank', 'noopener,noreferrer');
      if (!opened) {
        window.location.assign(data.url);
      }
    } catch {
      setOpenError(
        'Something went wrong. Check your connection and try again.'
      );
    } finally {
      setOpening(false);
    }
  }, [opening, stripeExpressAccountId]);

  const canUseExpressLink = Boolean(stripeExpressAccountId?.trim());

  return (
    <div className="min-w-0 w-full">
      <GlassCard padding="none" rounded="rounded-2xl" className="p-4 sm:p-8">
        <p className="text-sm font-semibold text-white">Stripe</p>
        <p className="mt-1 text-sm text-gray-400 leading-relaxed">
          View balance, charges, payouts, and tax forms in your Stripe
          dashboard. Bank and payout details are managed in Stripe.
        </p>
        <div className="mt-5">
          {canUseExpressLink ? (
            <Button
              type="button"
              variant="secondary"
              size="sm"
              icon={<ArrowTopRightOnSquareIcon className="h-4 w-4" />}
              iconPosition="right"
              className="w-full sm:w-auto"
              loading={opening}
              disabled={opening}
              onClick={() => void openExpressDashboard()}
            >
              Open Stripe Dashboard
            </Button>
          ) : (
            <Button
              href={STRIPE_MARKETING_FALLBACK}
              variant="secondary"
              size="sm"
              icon={<ArrowTopRightOnSquareIcon className="h-4 w-4" />}
              iconPosition="right"
              className="w-full sm:w-auto"
            >
              Open Stripe Dashboard
            </Button>
          )}
        </div>
        {openError ? (
          <p className="mt-3 text-sm text-red-300" role="alert">
            {openError}
          </p>
        ) : null}
      </GlassCard>
    </div>
  );
};
