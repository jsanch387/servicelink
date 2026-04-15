'use client';

import { Button, GlassCard } from '@/components/shared';
import { API_ROUTES } from '@/constants/routes';
import { CheckIcon } from '@heroicons/react/24/solid';
import { useRouter } from 'next/navigation';
import React, { useCallback, useState } from 'react';
import { FreePaymentPreviewLockedDashboard } from '../free-payment-preview';
import {
  SERVICELINK_GATE_CTA,
  SERVICELINK_GATE_LEAD,
  SERVICELINK_GATE_REASSURANCE,
  SERVICELINK_GATE_TITLE,
} from './servicelinkGateCopy';

/**
 * After Stripe Connect succeeds: owner must explicitly enable ServiceLink
 * checkout before the full payments settings UI appears.
 */
export const ProServicelinkPaymentsGate: React.FC = () => {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const enableServicelinkPayments = useCallback(async () => {
    setError(null);
    setLoading(true);
    try {
      const res = await fetch(API_ROUTES.PAYMENTS_SERVICELINK_ENABLE, {
        method: 'POST',
      });
      const data = (await res.json().catch(() => ({}))) as {
        success?: boolean;
        error?: string;
      };

      if (!res.ok || data.success === false) {
        setError(
          typeof data.error === 'string' && data.error.trim()
            ? data.error
            : 'Could not turn on payments. Try again.'
        );
        return;
      }

      router.refresh();
    } catch {
      setError('Something went wrong. Check your connection and try again.');
    } finally {
      setLoading(false);
    }
  }, [router]);

  return (
    <div className="mt-6 flex flex-col items-start sm:mt-8">
      <GlassCard
        padding="lg"
        rounded="rounded-2xl"
        className="w-full max-w-2xl shrink-0"
      >
        <div className="flex gap-3.5 sm:gap-4 items-start">
          <span
            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-emerald-500/15 text-emerald-400 ring-1 ring-emerald-400/25 sm:h-12 sm:w-12"
            aria-hidden
          >
            <CheckIcon className="h-5 w-5" />
          </span>
          <div className="min-w-0 flex-1 space-y-1.5 pt-0.5">
            <p className="text-xs font-semibold uppercase tracking-wide text-emerald-400/90">
              {SERVICELINK_GATE_TITLE}
            </p>
            <h2 className="text-lg font-bold tracking-tight text-white leading-snug sm:text-xl">
              {SERVICELINK_GATE_LEAD}
            </h2>
          </div>
        </div>

        <div className="mt-5 flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-center">
          <Button
            type="button"
            variant="inverse"
            size="sm"
            className="w-full sm:w-auto shrink-0"
            loading={loading}
            disabled={loading}
            onClick={() => void enableServicelinkPayments()}
          >
            {SERVICELINK_GATE_CTA}
          </Button>
        </div>
        {error ? (
          <p className="mt-3 text-sm text-red-300" role="alert">
            {error}
          </p>
        ) : null}
        <p className="mt-5 max-w-xl border-t border-white/[0.08] pt-5 text-sm text-gray-500 leading-snug">
          {SERVICELINK_GATE_REASSURANCE}
        </p>
      </GlassCard>

      <p className="mt-8 max-w-md text-left text-sm text-gray-500">
        Preview of your payments home after you turn payments on.
      </p>

      <FreePaymentPreviewLockedDashboard className="mt-8 w-full sm:mt-10" />
    </div>
  );
};
