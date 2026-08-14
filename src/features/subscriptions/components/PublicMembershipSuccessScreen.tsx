'use client';

import { Button } from '@/components/shared';
import React from 'react';
import { SubscriptionSuccessCheckmark } from './SubscriptionSuccessCheckmark';
import './SubscriptionPlanReadySuccess.css';

type Props = {
  title: string;
  body: string;
  doneHref: string;
  doneLabel: string;
};

/**
 * Centered public success (visit booked / already complete).
 * Same animation + layout as subscribe confirmation.
 */
export function PublicMembershipSuccessScreen({
  title,
  body,
  doneHref,
  doneLabel,
}: Props) {
  return (
    <main className="flex min-h-screen w-full flex-1 flex-col overflow-x-hidden overflow-y-auto bg-[var(--dashboard-bg)] px-4 pt-8 pb-28 sm:px-6 sm:pt-10 sm:pb-10 lg:px-8">
      <div className="mx-auto flex w-full max-w-md flex-1 flex-col items-center justify-center px-2 py-8 pb-20 text-center sm:-mt-10 sm:pb-28 lg:-mt-14">
        <div className="mb-3">
          <SubscriptionSuccessCheckmark />
        </div>

        <div className="subscription-plan-ready-content">
          <h1 className="text-2xl font-black tracking-tight text-white sm:text-3xl">
            {title}
          </h1>
          <p className="mx-auto mt-3 max-w-sm text-sm leading-relaxed text-zinc-400 sm:text-[0.9375rem]">
            {body}
          </p>
        </div>

        <div className="subscription-plan-ready-card mt-8 w-full">
          <Button
            type="button"
            variant="inverse"
            size="md"
            fullWidth
            href={doneHref}
          >
            {doneLabel}
          </Button>
        </div>
      </div>
    </main>
  );
}
