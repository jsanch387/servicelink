'use client';

import { GlassCard, Switch } from '@/components/shared';
import { API_ROUTES } from '@/constants/routes';
import { useRouter } from 'next/navigation';
import React, { useCallback, useEffect, useState } from 'react';

export interface PaymentsAcceptPaymentsCardProps {
  /** From `payment_settings.payments_enabled` (server). */
  paymentsEnabled: boolean;
}

/**
 * Toggle ServiceLink checkout on or off. When off, owners with an existing
 * `payment_settings` row keep the dashboard and can turn payments back on here.
 */
export const PaymentsAcceptPaymentsCard: React.FC<
  PaymentsAcceptPaymentsCardProps
> = ({ paymentsEnabled }) => {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [optimisticOn, setOptimisticOn] = useState(paymentsEnabled);

  useEffect(() => {
    setOptimisticOn(paymentsEnabled);
  }, [paymentsEnabled]);

  const handleCheckedChange = useCallback(
    async (next: boolean) => {
      if (next === optimisticOn || busy) return;
      if (next === false) {
        const ok = window.confirm(
          'Turn off ServiceLink payments?\n\nCustomers will not be able to pay by card on your booking page.'
        );
        if (!ok) return;
      }
      setError(null);
      setBusy(true);
      setOptimisticOn(next);
      try {
        const res = await fetch(API_ROUTES.PAYMENTS_SERVICELINK_SETTINGS, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ paymentsEnabled: next }),
        });
        const data = (await res.json().catch(() => ({}))) as {
          success?: boolean;
          error?: string;
        };
        if (!res.ok || data.success === false) {
          setOptimisticOn(paymentsEnabled);
          setError(
            typeof data.error === 'string' && data.error.trim()
              ? data.error
              : 'Could not update payments. Try again.'
          );
          return;
        }
        router.refresh();
      } catch {
        setOptimisticOn(paymentsEnabled);
        setError('Something went wrong. Check your connection and try again.');
      } finally {
        setBusy(false);
      }
    },
    [busy, optimisticOn, paymentsEnabled, router]
  );

  const description = optimisticOn
    ? 'Turn off to pause ServiceLink checkout.'
    : 'Turn on to accept payments at checkout.';

  return (
    <GlassCard
      padding="none"
      rounded="rounded-2xl"
      className="w-full overflow-hidden"
    >
      <div className="p-4 sm:px-8 sm:py-6">
        <Switch
          checked={optimisticOn}
          disabled={busy}
          onCheckedChange={handleCheckedChange}
          size="md"
          label="Accept payments on ServiceLink"
          description={description}
        />
        {error ? (
          <p className="mt-3 text-sm text-red-300" role="alert">
            {error}
          </p>
        ) : null}
      </div>
    </GlassCard>
  );
};
