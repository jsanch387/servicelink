'use client';

import { Button } from '@/components/shared';
import { API_ROUTES, ROUTES } from '@/constants/routes';
import { IOS_APP_STORE_URL } from '@/constants/appStore';
import { isOnboardingLegacyStripeTrialEnabled } from '@/features/pricing/config/onboardingLegacyStripeTrial';
import { ArrowRightIcon } from '@heroicons/react/24/outline';
import { BoltIcon } from '@heroicons/react/24/solid';
import { useRouter } from 'next/navigation';
import React, { useCallback, useMemo, useRef, useState } from 'react';

declare global {
  interface Window {
    fbq?: (...args: unknown[]) => void;
  }
}

const ACTIVATION_TRACKED_KEY = 'sl_activation_tracked';
import { OnboardingIosAppStep } from './OnboardingIosAppStep';
import { OnboardingStepNav } from './OnboardingStepNav';

interface Step5DoneProps {
  /** Slug for the public booking link path. */
  slug: string;
  onBack: () => void;
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

export const Step5Done: React.FC<Step5DoneProps> = ({ slug, onBack }) => {
  const router = useRouter();
  const [phase, setPhase] = useState<'activate' | 'app-promo'>('activate');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const activationTracked = useRef(false);

  const trackCompleteRegistrationOnce = useCallback(() => {
    if (activationTracked.current) return;
    if (sessionStorage.getItem(ACTIVATION_TRACKED_KEY) === '1') {
      activationTracked.current = true;
      return;
    }
    if (typeof window.fbq === 'function') {
      window.fbq('track', 'CompleteRegistration');
    }
    sessionStorage.setItem(ACTIVATION_TRACKED_KEY, '1');
    activationTracked.current = true;
  }, []);

  const slugDisplay = slug.trim() || 'your-link';
  const bookingHost = useMemo(() => publicBookingHost(), []);
  const bookingUrl = `${bookingHost}/${slugDisplay}`;

  const redirectToProfile = useCallback(() => {
    const href = `${ROUTES.DASHBOARD.BUSINESS_PROFILE}?onboarding=complete`;
    router.prefetch(href);
    router.push(href);
    void router.refresh();
  }, [router]);

  const handleActivateLink = async () => {
    setError(null);
    setLoading(true);
    try {
      if (isOnboardingLegacyStripeTrialEnabled()) {
        const res = await fetch(API_ROUTES.STRIPE_START_ONBOARDING_TRIAL, {
          method: 'POST',
        });
        const data = (await res.json()) as {
          success?: boolean;
          error?: string;
        };

        if (res.ok && data.success) {
          trackCompleteRegistrationOnce();
          if (IOS_APP_STORE_URL) {
            setPhase('app-promo');
          } else {
            redirectToProfile();
          }
          return;
        }

        setError(data.error ?? 'Something went wrong.');
        return;
      }

      const res = await fetch(API_ROUTES.ONBOARDING_V2_COMPLETE, {
        method: 'POST',
      });
      const data = (await res.json()) as {
        success?: boolean;
        error?: string;
      };

      if (res.ok && data.success) {
        trackCompleteRegistrationOnce();
        if (IOS_APP_STORE_URL) {
          setPhase('app-promo');
        } else {
          redirectToProfile();
        }
        return;
      }

      setError(data.error ?? 'Something went wrong.');
    } finally {
      setLoading(false);
    }
  };

  if (phase === 'app-promo') {
    return <OnboardingIosAppStep onContinue={redirectToProfile} />;
  }

  return (
    <div className="w-full">
      <div className="mb-6 sm:mb-8">
        <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-white tracking-tight">
          Go live
        </h1>
        <p className="max-w-xl text-sm sm:text-base text-gray-400 leading-relaxed">
          Your link goes live next.{' '}
          <span className="font-semibold text-white">
            Share it. Get booked.
          </span>
        </p>
      </div>

      <div className="rounded-2xl border border-white/10 bg-white/[0.02] overflow-hidden p-4">
        <div className="space-y-4">
          {error && (
            <p className="text-red-400 text-sm" role="alert">
              {error}
            </p>
          )}

          <div className="space-y-1.5">
            <p className="text-sm text-gray-200 font-medium">
              Your booking link
            </p>
            <p className="rounded-xl border border-white/10 bg-white/[0.04] px-4 py-3 text-sm sm:text-base font-mono text-white break-all leading-snug">
              {bookingUrl}
            </p>
          </div>

          <div className="flex gap-3 rounded-xl border border-white/10 bg-white/[0.04] p-4">
            <div
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-white"
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

          <div className="mt-4 sm:mt-8">
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

      <OnboardingStepNav onBack={onBack} backDisabled={loading} />
    </div>
  );
};
