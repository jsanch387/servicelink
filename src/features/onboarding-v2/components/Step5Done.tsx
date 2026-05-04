'use client';

import { Button } from '@/components/shared';
import { ArrowRightIcon } from '@heroicons/react/24/outline';
import React, { useState } from 'react';

const APP_DOMAIN = 'myservicelink.app';

interface Step5DoneProps {
  /** Slug for the public booking link path. */
  slug: string;
}

export const Step5Done: React.FC<Step5DoneProps> = ({ slug }) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const slugDisplay = slug.trim() || 'your-link';
  const bookingUrl = `${APP_DOMAIN}/${slugDisplay}`;

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
        <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold text-white tracking-tight uppercase">
          Go live!
        </h1>
        <p className="text-sm sm:text-base mt-2 text-gray-400">
          Your booking link is ready.{' '}
          <span className="font-semibold text-white">No card required.</span>
        </p>
      </div>

      <div className="rounded-2xl border border-white/[0.12] bg-zinc-900/80 p-4">
        {error && (
          <p className="text-red-400 text-sm mb-4" role="alert">
            {error}
          </p>
        )}

        <div className="mb-5">
          <p className="text-xs sm:text-sm text-gray-400 mb-1.5">
            Your booking link
          </p>
          <p className="text-base sm:text-lg font-bold text-white font-mono break-all">
            {bookingUrl}
          </p>
        </div>

        <div className="mb-6 rounded-xl border border-white/[0.08] bg-black/35 px-4 py-3.5 sm:px-4 sm:py-4">
          <div className="flex items-start justify-between gap-3">
            <p className="text-sm font-bold text-white">7-Day Pro Access</p>
            <span className="shrink-0 rounded-md bg-emerald-500 px-2 py-0.5 text-[10px] sm:text-xs font-bold uppercase tracking-wide text-white">
              Free
            </span>
          </div>
          <p className="mt-2 text-xs sm:text-sm text-gray-400 leading-relaxed">
            Unlimited bookings, deposit integrations, and more Pro tools—all
            included for your first week.
          </p>
        </div>

        <Button
          onClick={handleStartTrial}
          variant="inverse"
          size="lg"
          fullWidth
          loading={loading}
          icon={<ArrowRightIcon className="h-5 w-5 text-neutral-900" />}
          iconPosition="right"
        >
          Activate my link
        </Button>
      </div>
    </div>
  );
};
