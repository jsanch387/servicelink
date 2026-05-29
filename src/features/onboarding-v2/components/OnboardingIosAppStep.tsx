'use client';

import { Button, IosAppStoreButton } from '@/components/shared';
import { IOS_APP_STORE_URL } from '@/constants/appStore';
import { DevicePhoneMobileIcon } from '@heroicons/react/24/outline';

interface OnboardingIosAppStepProps {
  onContinue: () => void;
}

/** Shown once after activation — optional App Store download before profile modals. */
export function OnboardingIosAppStep({
  onContinue,
}: OnboardingIosAppStepProps) {
  return (
    <div className="w-full">
      <div className="mb-6 sm:mb-8">
        <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-white tracking-tight">
          Get the iPhone app
        </h1>
        <p className="max-w-xl text-sm sm:text-base text-gray-400 leading-relaxed">
          Download ServiceLink to manage bookings and stay up to date. Sign in
          with the same account you just used.
        </p>
      </div>

      <div className="rounded-2xl border border-white/10 bg-white/[0.02] overflow-hidden p-4">
        <div className="flex gap-3 rounded-xl border border-white/10 bg-white/[0.04] p-4">
          <div
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-white/[0.08] border border-white/10"
            aria-hidden
          >
            <DevicePhoneMobileIcon className="h-5 w-5 text-zinc-200" />
          </div>

          <div className="min-w-0 pt-0.5">
            <p className="text-sm font-semibold text-white">
              ServiceLink is on iPhone
            </p>
            <p className="mt-1 text-sm text-gray-400 leading-snug">
              Tap below to download from the App Store, or continue to your
              profile.
            </p>
          </div>
        </div>

        <div className="mt-4 flex flex-col gap-3 sm:mt-6">
          {IOS_APP_STORE_URL ? (
            <IosAppStoreButton className="w-full font-semibold min-h-[52px]" />
          ) : null}
          <Button
            type="button"
            variant="secondary"
            size="lg"
            fullWidth
            onClick={onContinue}
            className="font-semibold"
          >
            Continue
          </Button>
        </div>
      </div>
    </div>
  );
}
