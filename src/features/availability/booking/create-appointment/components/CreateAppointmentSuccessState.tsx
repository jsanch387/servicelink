'use client';

import { Button } from '@/components/shared';
import { ROUTES } from '@/constants/routes';
import React from 'react';
import './CreateAppointmentSuccessState.css';

/** Minimal animated check — circle + stroke draw, no heavy filled icon. */
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
          className="create-appt-success-ring stroke-emerald-400"
          strokeWidth="2"
          strokeLinecap="round"
        />
        <path
          d="M20.5 32.5 28 40l15.5-16"
          className="create-appt-success-check stroke-emerald-300"
          strokeWidth="2.75"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </div>
  );
}

export function CreateAppointmentSuccessState({
  membershipId,
}: {
  membershipId?: string | null;
} = {}) {
  const doneHref = membershipId?.trim()
    ? ROUTES.DASHBOARD.SUBSCRIPTIONS_SUBSCRIBER(membershipId.trim())
    : ROUTES.DASHBOARD.BOOKINGS;

  return (
    <div className="flex min-h-[55vh] flex-col items-center justify-center px-4 text-center animate-in fade-in duration-500">
      <div className="mb-7">
        <SuccessCheckmark />
      </div>

      <h1 className="text-2xl font-black tracking-tight text-white sm:text-3xl">
        Appointment confirmed
      </h1>
      <p className="mt-2 max-w-sm text-sm leading-relaxed text-zinc-400">
        {membershipId?.trim()
          ? 'You’re all set — this membership visit is on your calendar.'
          : 'You’re all set — it’s on your calendar. Check Bookings for details.'}
      </p>

      <Button
        type="button"
        variant="primary"
        href={doneHref}
        className="mt-8 min-w-[160px] cursor-pointer"
      >
        Done
      </Button>
    </div>
  );
}
