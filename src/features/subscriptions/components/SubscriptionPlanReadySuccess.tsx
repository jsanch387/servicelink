'use client';

import { Button } from '@/components/shared';
import React from 'react';
import type { CustomerSubscriptionPlan } from '../types/customerSubscriptionPlan';
import type { OwnerSubscriptionPlan } from '../types/ownerSubscriptionPlan';
import { SubscriptionPlanCard } from './SubscriptionPlanCard';
import './SubscriptionPlanReadySuccess.css';

interface SubscriptionPlanReadySuccessProps {
  plan: OwnerSubscriptionPlan;
  onContinue: () => void;
}

function SuccessCheckmark() {
  return (
    <div
      className="relative flex h-20 w-20 items-center justify-center"
      aria-hidden
    >
      <div className="absolute inset-0 rounded-full bg-emerald-400/10 blur-xl" />
      <svg viewBox="0 0 64 64" className="relative h-20 w-20" fill="none">
        <circle
          cx="32"
          cy="32"
          r="28"
          className="stroke-emerald-400/20"
          strokeWidth="1.5"
        />
        <circle
          cx="32"
          cy="32"
          r="28"
          className="subscription-plan-ready-ring stroke-emerald-400"
          strokeWidth="2"
          strokeLinecap="round"
        />
        <path
          d="M20.5 32.5 28 40l15.5-16"
          className="subscription-plan-ready-check stroke-emerald-300"
          strokeWidth="2.75"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </div>
  );
}

/** Map owner plan → public card shape for the success preview. */
function toPublicPreviewPlan(
  plan: OwnerSubscriptionPlan
): CustomerSubscriptionPlan {
  return {
    id: plan.id,
    name: plan.name,
    description: plan.description,
    cadenceOptions: plan.cadenceOptions,
    benefits: plan.benefits ?? [],
  };
}

export const SubscriptionPlanReadySuccess: React.FC<
  SubscriptionPlanReadySuccessProps
> = ({ plan, onContinue }) => {
  const previewPlan = toPublicPreviewPlan(plan);

  return (
    <main className="flex min-h-screen w-full flex-1 flex-col overflow-x-hidden overflow-y-auto bg-[var(--dashboard-bg)] px-4 pt-8 pb-28 sm:px-6 sm:pt-10 sm:pb-10 lg:px-8">
      <div className="mx-auto flex w-full max-w-md flex-1 flex-col items-center justify-center px-2 py-8 pb-20 text-center sm:-mt-10 sm:pb-28 lg:-mt-14">
        <div className="mb-3">
          <SuccessCheckmark />
        </div>

        <div className="subscription-plan-ready-content">
          <h1 className="text-2xl font-black tracking-tight text-white sm:text-3xl">
            Your plan is ready
          </h1>
        </div>

        <div className="subscription-plan-ready-card mt-8 w-full text-left">
          <SubscriptionPlanCard plan={previewPlan} preview />
        </div>

        <div className="subscription-plan-ready-card mt-8 w-full">
          <Button
            type="button"
            variant="inverse"
            size="md"
            fullWidth
            onClick={onContinue}
          >
            Done
          </Button>
        </div>
      </div>
    </main>
  );
};
