'use client';

import { Button } from '@/components/shared';
import { ROUTES } from '@/constants/routes';
import { PlusIcon } from '@heroicons/react/24/outline';
import { useRouter } from 'next/navigation';
import React from 'react';
import type { LoadOwnerMembershipsResult } from '../server/loadOwnerMembershipsState';
import type { MembershipsAccess } from '../types/membershipsAccess';
import type { OwnerSubscriber } from '../types/ownerSubscriptionPlan';
import { SubscriptionsConnectGate } from './gates/SubscriptionsConnectGate';
import { SubscriptionsNotProGate } from './gates/SubscriptionsNotProGate';
import { SubscriptionsPaymentsGate } from './gates/SubscriptionsPaymentsGate';
import { SubscriptionsProPausedBanner } from './gates/SubscriptionsProPausedBanner';
import { OwnerSubscriptionsCreateFirst } from './OwnerSubscriptionsCreateFirst';
import { OwnerSubscriptionsPlanList } from './OwnerSubscriptionsPlanList';

type ViewPhase = 'create_first' | 'list';

interface OwnerSubscriptionsPageProps {
  loadResult: LoadOwnerMembershipsResult;
  access: MembershipsAccess;
  /** Prefetched for the Subscribers tab. */
  subscribers?: OwnerSubscriber[];
}

/**
 * Owner dashboard: gates (Pro / Connect / payments) → create first plan → list.
 * When Pro lapses with existing plans: read-only list + paused banner (members still billing).
 */
export const OwnerSubscriptionsPage: React.FC<OwnerSubscriptionsPageProps> = ({
  loadResult,
  access,
  subscribers,
}) => {
  const router = useRouter();
  const gate = access.gate;
  const plans = loadResult.ok ? loadResult.plans : [];
  const phase: ViewPhase = plans.length === 0 ? 'create_first' : 'list';
  const catalogWritable = gate === 'ready';
  const showPausedCatalog =
    gate === 'not_pro' && loadResult.ok && plans.length > 0;
  const showReadyContent = catalogWritable && loadResult.ok;
  const showCatalog = showReadyContent || showPausedCatalog;
  const activeMemberCount = plans.reduce(
    (sum, plan) => sum + (plan.activeSubscriberCount ?? 0),
    0
  );

  const goCreatePlan = () => {
    router.push(ROUTES.DASHBOARD.SUBSCRIPTIONS_NEW);
  };

  return (
    <div className="flex h-full min-h-0 flex-col">
      <div className="flex-1 overflow-y-auto">
        <div className="mx-auto w-full min-w-0 max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
          <header className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div className="min-w-0">
              <h1 className="text-3xl font-bold leading-none text-white">
                Subscriptions
              </h1>
              <p className="mt-1 text-gray-400">
                Create plans customers can subscribe to from your booking link.
              </p>
            </div>
            {catalogWritable ? (
              <Button
                type="button"
                variant="inverse"
                size="sm"
                icon={<PlusIcon className="h-4 w-4" />}
                className="w-full shrink-0 sm:w-auto"
                onClick={goCreatePlan}
              >
                Create a plan
              </Button>
            ) : null}
          </header>

          {gate === 'not_pro' && !showPausedCatalog ? (
            <SubscriptionsNotProGate />
          ) : null}

          {showPausedCatalog ? (
            <div className="mb-6">
              <SubscriptionsProPausedBanner
                activeMemberCount={activeMemberCount}
              />
            </div>
          ) : null}

          {gate === 'needs_connect' ? (
            <SubscriptionsConnectGate
              resumeConnect={access.stripeConnectResume}
              stripeRestricted={access.stripeConnectRestricted}
            />
          ) : null}

          {gate === 'needs_payments' ? <SubscriptionsPaymentsGate /> : null}

          {(gate === 'ready' || gate === 'not_pro') && !loadResult.ok ? (
            <div className="mt-6 rounded-2xl border border-red-400/20 bg-red-400/10 p-4 sm:mt-8 sm:p-5">
              <p className="text-sm text-red-200">{loadResult.error}</p>
              <Button
                type="button"
                variant="secondary"
                size="sm"
                className="mt-3"
                onClick={() => router.refresh()}
              >
                Try again
              </Button>
            </div>
          ) : null}

          {showReadyContent && phase === 'create_first' ? (
            <div className="w-full max-w-2xl">
              <OwnerSubscriptionsCreateFirst onCreatePlan={goCreatePlan} />
            </div>
          ) : null}

          {showCatalog && phase === 'list' ? (
            <OwnerSubscriptionsPlanList
              plans={plans}
              catalogWritable={catalogWritable}
              initialSubscribers={subscribers}
            />
          ) : null}
        </div>
      </div>
    </div>
  );
};
