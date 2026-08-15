'use client';

import React from 'react';
import './SubscriptionPlanReadySuccess.css';

/** Animated ring + check used on membership public/owner success screens. */
export function SubscriptionSuccessCheckmark() {
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
