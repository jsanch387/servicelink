'use client';

import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

const REFRESH_INTERVAL_MS = 1200;

/**
 * Stripe can redirect back before webhook sync finishes.
 * Keep the user on the intended route and refresh until status updates.
 */
export function OnboardingCheckoutReturnGate() {
  const router = useRouter();

  useEffect(() => {
    const timer = window.setInterval(() => {
      router.refresh();
    }, REFRESH_INTERVAL_MS);

    return () => window.clearInterval(timer);
  }, [router]);

  return (
    <div className="min-h-screen bg-[#0f0f0f]">
      <div className="max-w-4xl mx-auto min-h-screen px-4 sm:px-8 flex items-center justify-center">
        <div className="flex flex-col items-center text-center">
          <div
            className="h-10 w-10 rounded-full border-2 border-white/20 border-t-white animate-spin"
            aria-hidden
          />
          <h1 className="mt-5 text-lg sm:text-xl font-semibold text-white tracking-tight">
            Almost there...
          </h1>
          <p className="mt-2 text-sm sm:text-base text-gray-300">
            Taking you to your Business Profile.
          </p>
        </div>
      </div>
    </div>
  );
}
