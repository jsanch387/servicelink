'use client';

import { Button } from '@/components/shared';
import { PlusIcon } from '@heroicons/react/24/outline';
import React, { useState } from 'react';
import type {
  OwnerSubscriptionPlan,
  OwnerSubscriptionsListTab,
} from '../types/ownerSubscriptionPlan';
import { OwnerSubscriptionPlanCard } from './OwnerSubscriptionPlanCard';
import { OwnerSubscriptionsSubscribers } from './OwnerSubscriptionsSubscribers';

interface OwnerSubscriptionsPlanListProps {
  plans: OwnerSubscriptionPlan[];
  onCreatePlan: () => void;
}

export const OwnerSubscriptionsPlanList: React.FC<
  OwnerSubscriptionsPlanListProps
> = ({ plans, onCreatePlan }) => {
  const [tab, setTab] = useState<OwnerSubscriptionsListTab>('plans');

  return (
    <div className="w-full space-y-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex w-fit gap-1 rounded-xl border border-white/[0.06] bg-white/[0.03] p-1">
          {(
            [
              { id: 'plans', label: 'Plans' },
              { id: 'subscribers', label: 'Subscribers' },
            ] as const
          ).map(item => {
            const active = tab === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => setTab(item.id)}
                className={`cursor-pointer rounded-lg px-3.5 py-2 text-sm font-medium transition-colors ${
                  active
                    ? 'bg-white text-black'
                    : 'text-zinc-400 hover:text-white'
                }`}
              >
                {item.label}
              </button>
            );
          })}
        </div>

        {tab === 'plans' ? (
          <Button
            type="button"
            variant="inverse"
            size="sm"
            className="w-full font-semibold sm:w-auto"
            icon={<PlusIcon className="h-4 w-4" aria-hidden />}
            onClick={onCreatePlan}
          >
            Create a plan
          </Button>
        ) : null}
      </div>

      {tab === 'plans' ? (
        <div className="space-y-4">
          <p className="text-sm text-gray-500">
            {plans.length} plan{plans.length === 1 ? '' : 's'} on your booking
            link
          </p>

          <div className="grid grid-cols-1 gap-3 sm:gap-4 lg:grid-cols-2">
            {plans.map(plan => (
              <OwnerSubscriptionPlanCard
                key={plan.id}
                plan={plan}
                subscriberCount={plan.activeSubscriberCount}
              />
            ))}
          </div>
        </div>
      ) : (
        <OwnerSubscriptionsSubscribers plans={plans} />
      )}
    </div>
  );
};
