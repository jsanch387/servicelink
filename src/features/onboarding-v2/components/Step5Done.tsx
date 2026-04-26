'use client';

import { Button } from '@/components/shared';
import { ArrowRightIcon } from '@heroicons/react/24/outline';
import React, { useState } from 'react';

interface Step5DoneProps {
  /** Slug for display only (e.g. "Your link: myservicelink.app/slug"). */
  slug: string;
}

export const Step5Done: React.FC<Step5DoneProps> = ({ slug }) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleStartTrial = async () => {
    setError(null);
    setLoading(true);
    try {
      const res = await fetch('/api/stripe/create-checkout-session', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          source: 'onboarding_trial_bridge',
        }),
      });
      const data = await res.json();
      if (!res.ok || !data.success || !data.url) {
        setError(data.error ?? 'Something went wrong.');
        return;
      }
      window.location.href = data.url;
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full">
      <div className="mb-6 sm:mb-8">
        <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-white tracking-tight">
          Start your 7-day free trial
        </h1>
        <p className="text-gray-400 text-sm sm:text-base mt-1">
          Make your booking link live today. You pay nothing now, then $10/month
          after your trial.
        </p>
      </div>

      <div className="rounded-2xl border border-white/10 bg-white/[0.02] overflow-hidden p-4 sm:p-5">
        {error && (
          <p className="text-red-400 text-sm mb-4" role="alert">
            {error}
          </p>
        )}
        {slug.trim() && (
          <p className="text-gray-400 text-xs mb-4 font-mono">
            Link to activate: myservicelink.app/{slug.trim()}
          </p>
        )}

        <div className="mb-5 rounded-xl border border-white/10 bg-white/[0.03] p-3.5">
          <div className="flex items-center justify-between gap-3">
            <span className="text-sm text-gray-300">$0 due today</span>
            <span className="text-sm font-semibold text-white">
              7-day trial starts now
            </span>
          </div>
          <div className="mt-1.5 flex items-center justify-between gap-3">
            <span className="text-xs text-gray-500">After trial</span>
            <span className="text-xs text-gray-400">$10/month</span>
          </div>
        </div>

        <div className="mb-6 space-y-2.5 text-sm text-gray-300">
          <p>Includes unlimited bookings and in-app payments.</p>
        </div>
        <Button
          onClick={handleStartTrial}
          variant="inverse"
          className="w-full sm:w-auto min-w-[220px]"
          icon={<ArrowRightIcon className="h-5 w-5" />}
          iconPosition="right"
          disabled={loading}
        >
          {loading ? 'Opening secure checkout…' : 'Start trial and go live'}
        </Button>
      </div>
    </div>
  );
};
