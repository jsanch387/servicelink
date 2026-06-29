'use client';

import { Button, Modal } from '@/components/shared';
import { PRO_WELCOME_MODAL_FEATURES } from '@/features/pricing/marketingPlanFeatures';
import { PRO_WELCOME_MODAL_SEEN_KEY } from '@/features/pricing/types';
import { CrownOutlineIcon } from '@/icons';
import { useRouter } from 'next/navigation';
import React from 'react';
import { PricingPlanFeatureList } from './PricingPlanFeatureList';
import {
  PRICING_MODAL_CROWN_TILE_CLASS,
  PRICING_MODAL_SUBTITLE_CLASS,
  PRICING_MODAL_TITLE_ROW_CLASS,
} from './pricingModalStyles';

interface ProWelcomeModalProps {
  isOpen: boolean;
  onClose: () => void;
}

/**
 * One-time welcome modal after successful upgrade.
 * On dismiss: persists "seen" in localStorage (per browser/device) and clears checkout=success from URL.
 */
export const ProWelcomeModal: React.FC<ProWelcomeModalProps> = ({
  isOpen,
  onClose,
}) => {
  const router = useRouter();

  const handleClose = () => {
    if (typeof window !== 'undefined') {
      try {
        window.localStorage.setItem(PRO_WELCOME_MODAL_SEEN_KEY, 'true');
      } catch {
        // ignore
      }
    }
    router.replace('/dashboard/settings');
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
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
            Welcome to Pro
          </h2>
          <p className={PRICING_MODAL_SUBTITLE_CLASS}>
            Thank you for upgrading—we&apos;re glad you&apos;re on Pro.
          </p>
        </header>

        <div className="h-px w-full bg-white/10" aria-hidden />

        <PricingPlanFeatureList
          items={PRO_WELCOME_MODAL_FEATURES}
          emphasizeHighlights
          bulletVariant="default"
        />

        <Button
          type="button"
          onClick={handleClose}
          variant="inverse"
          fullWidth
          className="font-black tracking-tight"
        >
          Get started
        </Button>
      </div>
    </Modal>
  );
};
