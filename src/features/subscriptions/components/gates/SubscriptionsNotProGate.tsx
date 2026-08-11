'use client';

import { GlassCard } from '@/components/shared';
import { PaymentsProTeaserBanner } from '@/features/payments/free-payment-preview';
import { CheckIcon } from '@heroicons/react/24/solid';
import React from 'react';

const PREVIEW_POINTS = [
  'Recurring revenue from your booking link',
  'Customers pick how often they want service',
  'Cancel and manage through Stripe',
] as const;

/**
 * Free tier: Pro upsell + dimmed memberships preview (mirrors payments free preview).
 */
export const SubscriptionsNotProGate: React.FC = () => {
  return (
    <div className="mt-6 w-full max-w-2xl sm:mt-8">
      <PaymentsProTeaserBanner
        title="Subscriptions are a Pro feature"
        description="Offer membership plans on your booking link, get paid on a schedule, and let customers manage billing in Stripe."
      />

      <div className="relative mt-6 sm:mt-8">
        <div
          className="pointer-events-none select-none opacity-40 sm:opacity-[0.44]"
          aria-hidden
        >
          <GlassCard padding="lg" rounded="rounded-2xl" className="!h-auto">
            <h2 className="text-xl font-black tracking-tight text-white sm:text-2xl">
              Offer memberships
            </h2>
            <p className="mt-3 max-w-xl text-sm leading-relaxed text-gray-400">
              Let customers pay on a schedule for ongoing services. Simple to
              set up, easy to manage.
            </p>
            <ul className="mt-5 space-y-2.5">
              {PREVIEW_POINTS.map(item => (
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
          </GlassCard>
        </div>
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="rounded-full border border-white/10 bg-black/50 px-3 py-1 text-xs font-medium text-zinc-300 backdrop-blur-sm">
            Pro required
          </span>
        </div>
      </div>
    </div>
  );
};
