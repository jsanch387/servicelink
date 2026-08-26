'use client';

import { GOOGLE_PLAY_STORE_URL, IOS_APP_STORE_URL } from '@/constants/appStore';
import { MARKETING_IMAGES } from '@/constants/marketingImages';
import { AppStoreDownloadBadge } from '@/features/landing-page/components/AppStoreDownloadBadge';
import { GooglePlayDownloadBadge } from '@/features/landing-page/components/GooglePlayDownloadBadge';
import { ArrowRightIcon } from '@heroicons/react/20/solid';
import Image from 'next/image';
import { useLayoutEffect } from 'react';

interface OnboardingIosAppStepProps {
  onContinue: () => void;
}

function StoreBadges({
  className = '',
  imageClassName,
}: {
  className?: string;
  imageClassName: string;
}) {
  const hasIos = Boolean(IOS_APP_STORE_URL);
  const hasAndroid = Boolean(GOOGLE_PLAY_STORE_URL);
  if (!hasIos && !hasAndroid) return null;

  return (
    <div className={`flex items-center justify-center gap-3 ${className}`}>
      {hasIos ? (
        <AppStoreDownloadBadge imageClassName={imageClassName} />
      ) : null}
      {hasAndroid ? (
        <GooglePlayDownloadBadge imageClassName={imageClassName} />
      ) : null}
    </div>
  );
}

function ContinueLink({
  onContinue,
  className = '',
}: {
  onContinue: () => void;
  className?: string;
}) {
  return (
    <button
      type="button"
      onClick={onContinue}
      className={`inline-flex cursor-pointer flex-col items-center gap-0.5 text-base text-gray-400 transition-colors hover:text-white ${className}`}
    >
      Continue to booking page
      <ArrowRightIcon className="h-4 w-4" aria-hidden />
    </button>
  );
}

function AppPreview({ className = '' }: { className?: string }) {
  return (
    <figure className={`relative overflow-hidden ${className}`}>
      <Image
        src={MARKETING_IMAGES.features.homeScreen}
        alt="ServiceLink mobile app home screen"
        width={1284}
        height={2778}
        className="h-auto w-full"
        priority
      />
      <div
        className="pointer-events-none absolute inset-x-0 bottom-0 h-14 bg-gradient-to-t from-[var(--dashboard-bg)] to-transparent sm:h-24"
        aria-hidden
      />
    </figure>
  );
}

/** Shown once after activation — optional store download before profile. */
function scrollOnboardingToTop() {
  const scroller = document.getElementById('onboarding-v2-scroll');
  if (scroller) scroller.scrollTop = 0;
  window.scrollTo(0, 0);
}

export function OnboardingIosAppStep({
  onContinue,
}: OnboardingIosAppStepProps) {
  useLayoutEffect(() => {
    scrollOnboardingToTop();
  }, []);

  return (
    <div className="w-full md:ml-[calc(-50vw+50%)] md:w-screen md:px-8">
      <div className="flex flex-col items-center sm:hidden">
        <h1 className="text-center text-2xl font-extrabold leading-tight tracking-tight text-white">
          Your business, in your pocket
        </h1>
        <p className="mt-1 max-w-[20rem] text-center text-sm leading-snug text-gray-400">
          Download the app to manage bookings from your phone.
        </p>

        <AppPreview className="-mt-11 h-[min(61dvh,530px)] w-[min(86vw,345px)]" />

        <StoreBadges className="mt-7" imageClassName="h-12" />
        <ContinueLink
          onContinue={onContinue}
          className="mt-8 flex min-h-[44px] items-center px-3"
        />
      </div>

      <div className="mx-auto hidden max-w-5xl sm:flex sm:items-center sm:justify-center sm:gap-12 lg:gap-16">
        <AppPreview className="h-[420px] w-[260px] shrink-0 md:h-[min(72dvh,660px)] md:w-[360px] lg:w-[400px]" />

        <div className="flex w-full max-w-md flex-col items-start text-left">
          <h1 className="text-3xl font-extrabold tracking-tight text-white">
            Your business, in your pocket
          </h1>
          <p className="mt-1.5 text-sm leading-snug text-gray-400">
            Download the app to manage bookings from your phone.
          </p>
          <StoreBadges
            className="mt-6 justify-start"
            imageClassName="h-14 sm:h-16"
          />
          <ContinueLink onContinue={onContinue} className="mt-7" />
        </div>
      </div>
    </div>
  );
}
