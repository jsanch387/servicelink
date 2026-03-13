'use client';

import { Button, GlassCard } from '@/components/shared';
import { CheckIcon } from '@heroicons/react/24/solid';
import React, { useState } from 'react';
import { PLANS, PRO_FEATURES } from '../types';

export const UpgradeContent: React.FC = () => {
  const plan = PLANS.pro;
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleGetPro = async () => {
    setError(null);
    setLoading(true);
    try {
      const res = await fetch('/api/stripe/create-checkout-session', {
        method: 'POST',
      });
      const data = await res.json();
      if (!res.ok || !data.success || !data.url) {
        setError(data.error ?? 'Something went wrong');
        return;
      }
      window.location.href = data.url;
    } catch {
      setError('Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="flex-1 py-8 sm:py-10 px-4 sm:px-6 lg:px-8 overflow-x-hidden overflow-y-auto bg-[var(--dashboard-bg)] min-h-screen w-full">
      <div className="max-w-2xl mx-auto w-full min-w-0">
        <div className="mb-8">
          <h1 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">
            Upgrade your plan
          </h1>
          <p className="text-gray-400 text-sm sm:text-base mt-1">
            Get unlimited bookings and more with Pro.
          </p>
        </div>

        <GlassCard
          padding="none"
          rounded="rounded-2xl"
          blurColor="bg-zinc-500"
          showBlur={true}
          className="w-full min-w-0 p-6 sm:p-8 text-left"
        >
          <div className="flex flex-wrap items-center gap-2 mb-2">
            <h2 className="text-xl font-bold text-white">{plan.name}</h2>
            <span className="rounded-md bg-white/10 px-2 py-0.5 text-xs font-medium text-white">
              Recommended
            </span>
          </div>
          <p className="text-gray-400 text-sm mb-6">{plan.description}</p>

          <div className="mb-6">
            <span className="text-4xl font-extrabold text-white">
              {plan.price}
            </span>
            <span className="text-gray-400 ml-1">/month</span>
          </div>

          <ul className="space-y-3 mb-8">
            {PRO_FEATURES.map(text => (
              <li
                key={text}
                className="flex items-center gap-3 text-gray-300 text-sm sm:text-base"
              >
                <CheckIcon
                  className="h-5 w-5 shrink-0 text-green-500"
                  aria-hidden
                />
                <span>{text}</span>
              </li>
            ))}
          </ul>

          {error && (
            <p className="text-rose-400 text-sm mb-4" role="alert">
              {error}
            </p>
          )}
          <Button
            type="button"
            variant="inverse"
            size="lg"
            className="w-full sm:w-auto"
            onClick={handleGetPro}
            disabled={loading}
            loading={loading}
          >
            Get Pro
          </Button>
        </GlassCard>
      </div>
    </main>
  );
};
