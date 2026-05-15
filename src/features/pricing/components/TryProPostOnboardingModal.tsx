'use client';

import { Button, Modal } from '@/components/shared';
import { ROUTES } from '@/constants/routes';
import { ONBOARDING_PRO_MODAL_SEEN_KEY } from '@/features/pricing/types';
import { CrownIcon } from '@/icons';
import { useRouter } from 'next/navigation';
import React from 'react';
import { POST_ONBOARDING_PRO_NUDGE_FEATURES } from '../marketingPlanFeatures';
import { PricingPlanFeatureList } from './PricingPlanFeatureList';

interface TryProPostOnboardingModalProps {
  isOpen: boolean;
  /**
   * @param continueToWelcome - true when user stays on profile ("Maybe later");
   *   false when navigating to upgrade so the live-profile modal does not flash.
   */
  onClose: (options?: { continueToWelcome?: boolean }) => void;
}

function markModalSeen() {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(ONBOARDING_PRO_MODAL_SEEN_KEY, 'true');
  } catch {
    // ignore
  }
}

/**
 * One-time modal after onboarding: soft Pro nudge with the same benefit framing
 * as pricing (minus support). Primary → upgrade route; dismiss → profile.
 */
export const TryProPostOnboardingModal: React.FC<
  TryProPostOnboardingModalProps
> = ({ isOpen, onClose }) => {
  const router = useRouter();

  const dismiss = () => {
    markModalSeen();
    // Keep ?onboarding=complete so RSC still passes showProfileWelcomeModalOnLoad
    // for the “booking link is live” modal right after this one.
    router.replace(`${ROUTES.DASHBOARD.BUSINESS_PROFILE}?onboarding=complete`);
    onClose({ continueToWelcome: true });
  };

  const handleUpgrade = () => {
    markModalSeen();
    onClose({ continueToWelcome: false });
    router.push('/dashboard/upgrade');
  };

  return (
    <Modal isOpen={isOpen} onClose={dismiss} title="" maxWidth="sm">
      <div className="flex flex-col gap-6">
        <div className="min-w-0">
          <h2 className="flex flex-wrap items-center gap-2 text-lg font-semibold tracking-tight text-white sm:text-xl">
            <CrownIcon className="h-6 w-6 shrink-0 text-amber-300" />
            <span>Upgrade to Pro?</span>
          </h2>
          <p className="mt-1.5 text-sm text-gray-400">
            One plan—everything below.
          </p>
        </div>

        <PricingPlanFeatureList
          items={POST_ONBOARDING_PRO_NUDGE_FEATURES}
          emphasizeHighlights
        />

        <div className="flex flex-col-reverse gap-2.5 sm:flex-row sm:items-center sm:justify-end sm:gap-3">
          <Button
            type="button"
            onClick={dismiss}
            variant="ghost"
            className="w-full text-gray-400 hover:text-white sm:w-auto"
          >
            Maybe later
          </Button>
          <Button
            type="button"
            onClick={handleUpgrade}
            variant="inverse"
            size="md"
            className="w-full sm:w-auto sm:min-w-[12rem]"
            icon={<CrownIcon className="h-5 w-5 shrink-0 text-neutral-900" />}
            iconPosition="left"
          >
            Upgrade to Pro
          </Button>
        </div>
      </div>
    </Modal>
  );
};
