'use client';

import { Button } from '@/components/shared';
import { API_ROUTES, ROUTES } from '@/constants/routes';
import { ArrowRightIcon } from '@heroicons/react/24/outline';
import { BoltIcon } from '@heroicons/react/24/solid';
import { useRouter } from 'next/navigation';
import React, { useMemo, useState } from 'react';

interface Step5DoneProps {
  /** Slug for the public booking link path. */
  slug: string;
}

function publicBookingHost(): string {
  const raw = process.env.NEXT_PUBLIC_SITE_URL?.trim();
  if (!raw) return 'myservicelink.app';
  try {
    const u = new URL(raw.startsWith('http') ? raw : `https://${raw}`);
    return u.host;
  } catch {
    return 'myservicelink.app';
  }
}

export const Step5Done: React.FC<Step5DoneProps> = ({ slug }) => {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const slugDisplay = slug.trim() || 'your-link';
  const bookingHost = useMemo(() => publicBookingHost(), []);
  const bookingUrl = `${bookingHost}/${slugDisplay}`;

  const handleActivateLink = async () => {
    setError(null);
    setLoading(true);
    try {
      const res = await fetch(API_ROUTES.STRIPE_START_ONBOARDING_TRIAL, {
        method: 'POST',
      });
      const data = (await res.json()) as {
        success?: boolean;
        error?: string;
      };

      if (res.ok && data.success) {
        const href = `${ROUTES.DASHBOARD.BUSINESS_PROFILE}?onboarding=complete`;
        router.prefetch(href);
        router.push(href);
        return;
      }

      setError(data.error ?? 'Something went wrong.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full">
      <header className="mb-6 sm:mb-8">
        <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold text-white tracking-tight">
          Go live
        </h1>
        <p className="text-sm sm:text-base mt-2 text-gray-400 leading-relaxed max-w-xl">
          Your link goes live next.{' '}
          <span className="font-semibold text-white">
            Share it. Get booked.
          </span>
        </p>
      </header>

      <div className="rounded-2xl border border-white/10 bg-zinc-900/90 p-4 sm:p-5 shadow-sm shadow-black/20">
        {error && (
          <p className="text-red-400 text-sm mb-4" role="alert">
            {error}
          </p>
        )}

        <div>
          <p className="text-xs text-gray-500">Your booking link</p>
          <p className="mt-1 text-sm sm:text-base font-bold text-white font-mono break-all leading-snug">
            {bookingUrl}
          </p>
        </div>

        <div className="mt-5 flex gap-3 rounded-xl border border-white/[0.06] bg-black/40 p-4">
          <div
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-white shadow-sm"
            aria-hidden
          >
            <BoltIcon className="h-5 w-5 text-neutral-900" />
          </div>

          <div className="min-w-0 pt-0.5">
            <p className="text-sm font-semibold text-white">
              Ready to go live?
            </p>
            <p className="mt-1 text-sm text-gray-400 leading-snug">
              Tap below, then share your link so clients can book you.
            </p>
          </div>
        </div>

        <div className="mt-5">
          <Button
            onClick={handleActivateLink}
            variant="inverse"
            size="lg"
            fullWidth
            loading={loading}
            className="font-semibold"
            icon={<ArrowRightIcon className="h-5 w-5 text-neutral-900" />}
            iconPosition="right"
          >
            Activate my link
          </Button>
        </div>
      </div>
    </div>
  );
};
