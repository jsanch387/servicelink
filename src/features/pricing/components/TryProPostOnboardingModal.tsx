'use client';

import { Button, Modal } from '@/components/shared';
import {
  ONBOARDING_PRO_MODAL_SEEN_KEY,
  PRO_FEATURES,
} from '@/features/pricing/types';
import { CheckIcon, StarIcon } from '@heroicons/react/24/solid';
import { useRouter } from 'next/navigation';
import React from 'react';

interface TryProPostOnboardingModalProps {
  isOpen: boolean;
  onClose: () => void;
}

/**
 * One-time modal shown when user lands on business profile page right after completing onboarding.
 * Invites them to try Pro with benefits. "Try Pro" → upgrade route; "Maybe later" or overlay → dismiss and set seen.
 */
export const TryProPostOnboardingModal: React.FC<
  TryProPostOnboardingModalProps
> = ({ isOpen, onClose }) => {
  const router = useRouter();

  const dismiss = () => {
    if (typeof window !== 'undefined') {
      try {
        window.localStorage.setItem(ONBOARDING_PRO_MODAL_SEEN_KEY, 'true');
      } catch {
        // ignore
      }
    }
    router.replace('/dashboard/business-profile');
    onClose();
  };

  const handleTryPro = () => {
    if (typeof window !== 'undefined') {
      try {
        window.localStorage.setItem(ONBOARDING_PRO_MODAL_SEEN_KEY, 'true');
      } catch {
        // ignore
      }
    }
    onClose();
    router.push('/dashboard/upgrade');
  };

  return (
    <Modal isOpen={isOpen} onClose={dismiss} title="" maxWidth="md">
      <div className="space-y-6">
        <div className="rounded-xl bg-gradient-to-br from-neutral-700/40 via-neutral-800/30 to-black/50 border border-white/10 p-4 sm:p-5 -mt-2 shadow-inner">
          <div className="flex items-center gap-3 mb-2">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-amber-500/20">
              <StarIcon className="h-5 w-5 text-amber-400" />
            </span>
            <h2 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
              Your profile is live — want more?
            </h2>
          </div>
          <p className="text-gray-400 text-sm sm:text-base">
            Try Pro for unlimited bookings, a verified badge, more portfolio
            images, multiple price options per service, and priority support.
          </p>
        </div>
        <ul className="space-y-2">
          {PRO_FEATURES.slice(0, 5).map((item, i) => (
            <li
              key={i}
              className="flex items-center gap-3 text-gray-300 text-sm"
            >
              {item.highlight ? (
                <StarIcon className="h-4 w-4 shrink-0 text-amber-400" />
              ) : (
                <CheckIcon className="h-4 w-4 shrink-0 text-green-500" />
              )}
              <span
                className={
                  item.highlight ? 'font-semibold text-white' : undefined
                }
              >
                {item.text}
              </span>
            </li>
          ))}
        </ul>
        <div className="flex flex-col-reverse sm:flex-row gap-2 pt-2">
          <Button
            type="button"
            onClick={dismiss}
            variant="secondary"
            className="w-full sm:w-auto"
          >
            Maybe later
          </Button>
          <Button
            type="button"
            onClick={handleTryPro}
            variant="inverse"
            className="w-full sm:flex-1"
          >
            Try Pro
          </Button>
        </div>
      </div>
    </Modal>
  );
};
