'use client';

import { Button, Modal } from '@/components/shared';
import {
  CheckCircleIcon,
  LinkIcon,
  PencilIcon,
  PhotoIcon,
} from '@heroicons/react/24/outline';
import React, { useEffect, useState } from 'react';

interface ProfileWelcomeModalProps {
  isOpen: boolean;
  /** Public booking URL shown as confirmation the link is live. */
  bookingLink?: string;
  onEditProfile: () => void;
  onDismiss: () => void;
}

function useIsDesktopModal() {
  const [isDesktop, setIsDesktop] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia('(min-width: 640px)');
    const update = () => setIsDesktop(mq.matches);
    update();
    mq.addEventListener('change', update);
    return () => mq.removeEventListener('change', update);
  }, []);

  return isDesktop;
}

const CARD_ROW_CLASS =
  'flex min-h-[3.25rem] items-center gap-3 rounded-xl border border-white/[0.08] bg-white/[0.03] px-3.5 py-3';

const ICON_TILE_CLASS =
  'flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-white/[0.06]';

/**
 * One-time welcome after onboarding: confirms the booking link is live and
 * nudges the owner to polish their public profile.
 */
export function ProfileWelcomeModal({
  isOpen,
  bookingLink,
  onEditProfile,
  onDismiss,
}: ProfileWelcomeModalProps) {
  const isDesktop = useIsDesktopModal();

  return (
    <Modal
      isOpen={isOpen}
      onClose={onDismiss}
      title=""
      maxWidth="sm"
      presentation={isDesktop ? 'default' : 'sheet'}
      panelClassName={!isDesktop ? '!max-h-[92dvh]' : ''}
      uniformHorizontalPadding16
      contentClassName={
        isDesktop
          ? '!pt-6 sm:!pt-7 !pb-6'
          : '!pt-2 !pb-[max(1.25rem,env(safe-area-inset-bottom))]'
      }
    >
      <div className="flex flex-col">
        {!isDesktop ? (
          <div className="flex justify-center pb-4" aria-hidden="true">
            <div className="h-1 w-10 rounded-full bg-white/20" />
          </div>
        ) : null}

        <div className="flex flex-col items-center text-center sm:items-start sm:text-left">
          <div
            className="relative flex h-14 w-14 items-center justify-center rounded-2xl border border-emerald-500/25 bg-emerald-500/10"
            aria-hidden
          >
            <CheckCircleIcon className="h-7 w-7 text-emerald-400" />
            <span className="absolute -right-0.5 -top-0.5 flex h-3 w-3">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400/60" />
              <span className="relative inline-flex h-3 w-3 rounded-full bg-emerald-400 ring-2 ring-[var(--dashboard-bg)]" />
            </span>
          </div>

          <h2 className="mt-5 text-2xl font-black tracking-tight text-white sm:text-[1.625rem]">
            Your booking link is live
          </h2>
          <p className="mt-2 max-w-sm text-sm leading-relaxed text-zinc-400 sm:text-[0.9375rem]">
            This is the page customers see when they visit your link. A polished
            profile helps you look professional and win more bookings.
          </p>
        </div>

        <div className="mt-6 flex flex-col gap-3" aria-label="Profile setup">
          {bookingLink ? (
            <div className={CARD_ROW_CLASS}>
              <span className={ICON_TILE_CLASS}>
                <LinkIcon className="h-4 w-4 text-zinc-400" aria-hidden />
              </span>
              <p className="min-w-0 flex-1 truncate text-sm font-medium leading-snug text-zinc-200">
                {bookingLink}
              </p>
            </div>
          ) : null}

          <div className={CARD_ROW_CLASS}>
            <span className={ICON_TILE_CLASS}>
              <PhotoIcon className="h-4 w-4 text-zinc-400" aria-hidden />
            </span>
            <span className="flex-1 text-sm leading-snug text-zinc-300">
              Add your logo and cover photo
            </span>
          </div>

          <div className={CARD_ROW_CLASS}>
            <span className={ICON_TILE_CLASS}>
              <PencilIcon className="h-4 w-4 text-zinc-400" aria-hidden />
            </span>
            <span className="flex-1 text-sm leading-snug text-zinc-300">
              Fill in your business details
            </span>
          </div>
        </div>

        <div className="mt-6 flex flex-col gap-2.5">
          <Button
            type="button"
            onClick={onEditProfile}
            variant="inverse"
            fullWidth
            className="font-semibold"
            icon={<PencilIcon className="h-4 w-4" />}
            iconPosition="left"
          >
            Customize profile
          </Button>
          <Button
            type="button"
            onClick={onDismiss}
            variant="ghost"
            fullWidth
            className="text-zinc-500 hover:text-white"
          >
            Looks good for now
          </Button>
        </div>
      </div>
    </Modal>
  );
}
