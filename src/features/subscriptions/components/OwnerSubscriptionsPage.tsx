'use client';

import { Button } from '@/components/shared';
import { ROUTES } from '@/constants/routes';
import { useRouter } from 'next/navigation';
import React from 'react';
import type { LoadOwnerMembershipsResult } from '../server/loadOwnerMembershipsState';
import type { MembershipsAccess } from '../types/membershipsAccess';
import { SubscriptionsConnectGate } from './gates/SubscriptionsConnectGate';
import { SubscriptionsNotProGate } from './gates/SubscriptionsNotProGate';
import { SubscriptionsPaymentsGate } from './gates/SubscriptionsPaymentsGate';
import { OwnerSubscriptionsCreateFirst } from './OwnerSubscriptionsCreateFirst';
import { OwnerSubscriptionsPlanList } from './OwnerSubscriptionsPlanList';

type ViewPhase = 'create_first' | 'list';

interface OwnerSubscriptionsPageProps {
  loadResult: LoadOwnerMembershipsResult;
  access: MembershipsAccess;
}

/**
 * Owner dashboard: gates (Pro / Connect / payments) → create first plan → list.
 * No separate "turned on" flag — presence of plans drives the UI.
 */
export const OwnerSubscriptionsPage: React.FC<OwnerSubscriptionsPageProps> = ({
  loadResult,
  access,
}) => {
  const router = useRouter();
  const gate = access.gate;
  const plans = loadResult.ok ? loadResult.plans : [];
  const phase: ViewPhase = plans.length === 0 ? 'create_first' : 'list';
  const showReadyContent = gate === 'ready' && loadResult.ok;

  const goCreatePlan = () => {
    router.push(ROUTES.DASHBOARD.SUBSCRIPTIONS_NEW);
  };

  return (
    <main className="flex min-h-screen w-full flex-1 flex-col overflow-x-hidden overflow-y-auto bg-[var(--dashboard-bg)] px-4 pt-8 pb-28 sm:px-6 sm:pt-10 sm:pb-10 lg:px-8">
      <div
        className={`flex w-full min-w-0 flex-1 flex-col ${
          showReadyContent && phase === 'list'
            ? 'mx-auto max-w-5xl'
            : 'mx-auto max-w-6xl'
        }`}
      >
        <div className="shrink-0">
          <h1 className="text-2xl font-black tracking-tight text-white sm:text-3xl">
            Subscriptions
          </h1>
          <p className="mt-1 text-sm text-gray-500">
            Create plans customers can subscribe to from your booking link.
          </p>
        </div>

        {gate === 'not_pro' ? <SubscriptionsNotProGate /> : null}

        {gate === 'needs_connect' ? (
          <SubscriptionsConnectGate
            resumeConnect={access.stripeConnectResume}
            stripeRestricted={access.stripeConnectRestricted}
          />
        ) : null}

        {gate === 'needs_payments' ? <SubscriptionsPaymentsGate /> : null}

        {gate === 'ready' && !loadResult.ok ? (
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
          <div className="flex flex-1 flex-col items-center justify-start pt-10 sm:pt-14">
            <div className="w-full max-w-2xl">
              <OwnerSubscriptionsCreateFirst onCreatePlan={goCreatePlan} />
            </div>
          </div>
        ) : null}

        {showReadyContent && phase === 'list' ? (
          <div className="mt-6 sm:mt-8">
            <OwnerSubscriptionsPlanList
              plans={plans}
              onCreatePlan={goCreatePlan}
            />
          </div>
        ) : null}
      </div>
    </main>
  );
};
