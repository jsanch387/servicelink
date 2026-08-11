'use client';

import { Button, GlassCard } from '@/components/shared';
import {
  CalendarDaysIcon,
  CurrencyDollarIcon,
  PlusIcon,
  UserGroupIcon,
} from '@heroicons/react/24/outline';
import React from 'react';

interface OwnerSubscriptionsCreateFirstProps {
  onCreatePlan: () => void;
}

const TIP_CARDS = [
  {
    title: 'Name and price',
    description: 'What customers see and what they pay.',
    icon: CurrencyDollarIcon,
  },
  {
    title: 'How often',
    description: 'They pick a schedule when they subscribe.',
    icon: CalendarDaysIcon,
  },
  {
    title: 'Subscribers',
    description: "See who's active, past due, or canceled.",
    icon: UserGroupIcon,
  },
] as const;

export const OwnerSubscriptionsCreateFirst: React.FC<
  OwnerSubscriptionsCreateFirstProps
> = ({ onCreatePlan }) => {
  return (
    <div className="w-full space-y-6 text-left">
      <GlassCard padding="lg" rounded="rounded-2xl" className="!h-auto w-full">
        <h2 className="text-xl font-black tracking-tight text-white sm:text-2xl">
          Create your first plan
        </h2>
        <p className="mt-3 max-w-xl text-sm leading-relaxed text-gray-400">
          A plan is what customers subscribe to. Keep it simple — one offering
          with a few schedule options.
        </p>
        <div className="mt-6">
          <Button
            type="button"
            variant="inverse"
            size="sm"
            className="w-full sm:w-auto font-semibold"
            icon={<PlusIcon className="h-4 w-4" aria-hidden />}
            onClick={onCreatePlan}
          >
            Create a plan
          </Button>
        </div>
      </GlassCard>

      <div className="grid w-full grid-cols-1 gap-3 sm:grid-cols-3 sm:gap-4">
        {TIP_CARDS.map(card => (
          <div
            key={card.title}
            className="rounded-2xl border border-white/10 bg-white/[0.02] p-4 text-left"
          >
            <span className="mb-3 flex h-9 w-9 items-center justify-center rounded-xl bg-white/[0.06] text-zinc-300">
              <card.icon className="h-5 w-5" aria-hidden />
            </span>
            <h3 className="text-sm font-semibold text-white">{card.title}</h3>
            <p className="mt-1 text-xs leading-relaxed text-gray-500">
              {card.description}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
};
