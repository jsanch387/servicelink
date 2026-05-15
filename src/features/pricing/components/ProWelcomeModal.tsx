'use client';

import { Button, Modal } from '@/components/shared';
import { PRO_WELCOME_MODAL_SEEN_KEY } from '@/features/pricing/types';
import {
  CheckBadgeIcon,
  PhotoIcon,
  Squares2X2Icon,
  TagIcon,
} from '@heroicons/react/24/outline';
import { useRouter } from 'next/navigation';
import React from 'react';

const PRO_WELCOME_BULLETS = [
  {
    icon: PhotoIcon,
    text: 'Upload up to 8 work photos so customers see more of your work',
    accent: null as 'blue' | 'emerald' | 'amber' | null,
  },
  {
    icon: CheckBadgeIcon,
    text: 'Your public profile shows a verified badge for trust',
    accent: 'blue' as const,
  },
  {
    icon: Squares2X2Icon,
    text: 'Unlimited bookings on your public page',
    accent: 'emerald' as const,
  },
  {
    icon: TagIcon,
    text: 'Multiple price options per service',
    accent: 'amber' as const,
  },
] as const;

const ACCENT_CLASSES = {
  blue: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
  emerald: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
  amber: 'bg-amber-500/20 text-amber-400 border-amber-500/30',
} as const;

interface ProWelcomeModalProps {
  isOpen: boolean;
  onClose: () => void;
}

/**
 * One-time welcome modal after successful upgrade.
 * On dismiss: persists "seen" in localStorage (per browser/device) and clears checkout=success from URL.
 * New browser or device will show the modal once; same browser won't show again after dismiss.
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
    <Modal isOpen={isOpen} onClose={handleClose} title="" maxWidth="md">
      <div className="space-y-6">
        {/* Header: gray/black chrome look */}
        <div className="rounded-xl bg-gradient-to-br from-neutral-700/40 via-neutral-800/30 to-black/50 border border-white/10 p-4 sm:p-5 -mt-2 shadow-inner">
          <h2 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
            Welcome to ServiceLink Pro
          </h2>
          <p className="text-gray-400 text-sm sm:text-base mt-1">
            Thanks for upgrading. Here&apos;s what you get:
          </p>
        </div>
        <ul className="space-y-3">
          {PRO_WELCOME_BULLETS.map(({ icon: Icon, text, accent }) => (
            <li key={text} className="flex items-start gap-3">
              <span
                className={`flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl border ${
                  accent
                    ? ACCENT_CLASSES[accent]
                    : 'bg-white/10 text-white border-white/10'
                }`}
              >
                <Icon className="h-5 w-5" />
              </span>
              <span className="text-gray-300 text-sm sm:text-base pt-1.5">
                {text}
              </span>
            </li>
          ))}
        </ul>
        <div className="pt-2">
          <Button
            type="button"
            onClick={handleClose}
            variant="inverse"
            className="w-full sm:w-auto"
          >
            Get started
          </Button>
        </div>
      </div>
    </Modal>
  );
};
