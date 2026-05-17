'use client';

import { Button, Modal } from '@/components/shared';
import { ROUTES } from '@/constants/routes';
import { ONBOARDING_PRO_MODAL_SEEN_KEY } from '@/features/pricing/types';
import { CrownIcon, CrownOutlineIcon } from '@/icons';
import { useRouter } from 'next/navigation';
import React from 'react';
import { PRO_WELCOME_MODAL_FEATURES } from '../marketingPlanFeatures';
import { PricingPlanFeatureList } from './PricingPlanFeatureList';
import {
  PRICING_MODAL_CROWN_TILE_CLASS,
  PRICING_MODAL_SUBTITLE_CLASS,
  PRICING_MODAL_TITLE_ROW_CLASS,
} from './pricingModalStyles';

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
    <Modal
      isOpen={isOpen}
      onClose={dismiss}
      title=""
      maxWidth="sm"
      uniformHorizontalPadding16
      contentClassName="!pt-6 sm:!pt-7 !pb-6"
    >
      <div className="flex flex-col gap-7">
        <header className="min-w-0">
          <h2 className={PRICING_MODAL_TITLE_ROW_CLASS}>
            <span className={PRICING_MODAL_CROWN_TILE_CLASS} aria-hidden>
              <CrownOutlineIcon className="h-[1.125rem] w-[1.125rem] text-white" />
            </span>
            Upgrade to Pro?
          </h2>
          <p className={PRICING_MODAL_SUBTITLE_CLASS}>
            Here&apos;s what you unlock with Pro on your booking link.
          </p>
        </header>

        <div className="h-px w-full bg-white/10" aria-hidden />

        <PricingPlanFeatureList
          items={PRO_WELCOME_MODAL_FEATURES}
          emphasizeHighlights
          bulletVariant="neutral"
        />

        <div className="flex flex-col gap-3">
          <Button
            type="button"
            onClick={handleUpgrade}
            variant="inverse"
            fullWidth
            className="font-black tracking-tight"
            icon={
              <CrownIcon
                className="h-5 w-5 shrink-0 text-neutral-900"
                aria-hidden
              />
            }
            iconPosition="left"
          >
            Upgrade to Pro
          </Button>
          <Button
            type="button"
            onClick={dismiss}
            variant="ghost"
            fullWidth
            className="text-zinc-500 hover:text-white"
          >
            Maybe later
          </Button>
        </div>
      </div>
    </Modal>
  );
};
