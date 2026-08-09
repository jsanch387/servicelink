'use client';

import { Button, GlassCard } from '@/components/shared';
import { ROUTES } from '@/constants/routes';
import { CheckIcon } from '@heroicons/react/24/solid';
import React from 'react';

const POINTS = [
  'Memberships charge customers through ServiceLink checkout',
  'Turn on Accept payments once Stripe is connected',
  'Then come back here to offer plans on your booking link',
] as const;

/**
 * Pro + Connect ready, but ServiceLink payments still off.
 */
export const SubscriptionsPaymentsGate: React.FC = () => {
  return (
    <div className="mt-6 w-full max-w-2xl sm:mt-8">
      <GlassCard padding="lg" rounded="rounded-2xl" className="!h-auto">
        <h2 className="text-xl font-black tracking-tight text-white sm:text-2xl">
          Turn on payments first
        </h2>
        <p className="mt-3 max-w-xl text-sm leading-relaxed text-gray-400">
          Subscriptions use the same Stripe account as booking payments. Enable
          ServiceLink payments, then you can offer memberships.
        </p>

        <ul className="mt-5 space-y-2.5">
          {POINTS.map(item => (
            <li
              key={item}
              className="flex items-start gap-2.5 text-sm text-gray-300"
            >
              <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-emerald-500/12 text-emerald-400 ring-1 ring-emerald-400/20">
                <CheckIcon className="h-3 w-3" aria-hidden />
              </span>
              <span>{item}</span>
            </li>
          ))}
        </ul>

        <div className="mt-6">
          <Button
            type="button"
            variant="inverse"
            size="sm"
            className="w-full sm:w-auto"
            href={ROUTES.DASHBOARD.PAYMENTS}
          >
            Go to Payments
          </Button>
        </div>
      </GlassCard>
    </div>
  );
};
