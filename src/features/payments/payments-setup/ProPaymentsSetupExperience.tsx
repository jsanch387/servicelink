'use client';

import { Button, GlassCard } from '@/components/shared';
import { CheckIcon } from '@heroicons/react/24/solid';
import React, { useCallback, useState } from 'react';
import { FreePaymentPreviewLockedDashboard } from '../free-payment-preview';
import {
  PAYMENTS_SETUP_BENEFITS,
  PAYMENTS_SETUP_CTA_CONNECT_STRIPE,
  PAYMENTS_SETUP_HERO_TITLE,
  PAYMENTS_SETUP_LEAD,
  PAYMENTS_SETUP_TEASE_OVERLINE,
} from './paymentsSetupCopy';

/**
 * Pro-only “Connect Stripe” screen: opens Stripe-hosted Connect onboarding (no app DB yet).
 */
export const ProPaymentsSetupExperience: React.FC = () => {
  const [connectLoading, setConnectLoading] = useState(false);
  const [connectError, setConnectError] = useState<string | null>(null);

  const startStripeConnect = useCallback(async () => {
    setConnectError(null);
    setConnectLoading(true);
    try {
      const res = await fetch('/api/stripe/connect/onboard', {
        method: 'POST',
      });
      const data = (await res.json().catch(() => ({}))) as {
        success?: boolean;
        url?: string;
        error?: string;
      };

      if (!res.ok || data.success === false) {
        setConnectError(
          typeof data.error === 'string' && data.error.trim()
            ? data.error
            : 'Could not start Stripe. Try again.'
        );
        return;
      }

      if (typeof data.url !== 'string' || !data.url.trim()) {
        setConnectError(
          'Stripe did not return a link. Check your integration.'
        );
        return;
      }

      window.location.assign(data.url);
    } catch {
      setConnectError(
        'Something went wrong. Check your connection and try again.'
      );
    } finally {
      setConnectLoading(false);
    }
  }, []);

  return (
    <div className="mt-6 flex flex-col items-start sm:mt-8">
      <GlassCard
        padding="lg"
        rounded="rounded-2xl"
        className="w-full max-w-2xl shrink-0"
      >
        <h2 className="text-xl font-black tracking-tight text-white sm:text-2xl">
          {PAYMENTS_SETUP_HERO_TITLE}
        </h2>
        <p className="mt-3 max-w-xl text-sm leading-relaxed text-gray-400">
          {PAYMENTS_SETUP_LEAD}
        </p>

        <div className="mt-5 flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-center">
          <Button
            type="button"
            variant="inverse"
            size="sm"
            className="w-full sm:w-auto shrink-0"
            loading={connectLoading}
            disabled={connectLoading}
            onClick={() => void startStripeConnect()}
          >
            {PAYMENTS_SETUP_CTA_CONNECT_STRIPE}
          </Button>
        </div>
        {connectError ? (
          <p className="mt-3 text-sm text-red-300" role="alert">
            {connectError}
          </p>
        ) : null}

        <ul className="mt-6 max-w-xl space-y-3 border-t border-white/[0.08] pt-6 text-left">
          {PAYMENTS_SETUP_BENEFITS.map(({ id, text }) => (
            <li
              key={id}
              className="flex gap-3 text-sm leading-relaxed text-gray-300"
            >
              <span
                className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-emerald-500/12 text-emerald-400 ring-1 ring-emerald-400/20"
                aria-hidden
              >
                <CheckIcon className="h-3 w-3" />
              </span>
              <span>{text}</span>
            </li>
          ))}
        </ul>
      </GlassCard>

      <p className="mt-8 max-w-md text-left text-sm text-gray-500">
        {PAYMENTS_SETUP_TEASE_OVERLINE}
      </p>

      <FreePaymentPreviewLockedDashboard className="mt-8 w-full sm:mt-10" />
    </div>
  );
};
