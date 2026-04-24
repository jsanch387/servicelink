'use client';

import { Button, CrownIcon, Modal } from '@/components/shared';
import { API_ROUTES, ROUTES } from '@/constants/routes';
import { useEffect, useState } from 'react';

export interface SyncBookingsConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  /** Called after the calendar handoff URL is fetched successfully. */
  onConfirm?: () => void;
  /**
   * When false (free tier), show the same copy but gate the flow with Upgrade to Pro.
   * @default true
   */
  isProSubscriber?: boolean;
}

type Step = 'intro' | 'loading' | 'error';

export function SyncBookingsConfirmModal({
  isOpen,
  onClose,
  onConfirm,
  isProSubscriber = true,
}: SyncBookingsConfirmModalProps) {
  const [step, setStep] = useState<Step>('intro');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    if (!isOpen) {
      setStep('intro');
      setErrorMessage(null);
    }
  }, [isOpen]);

  const handleConfirm = async () => {
    setStep('loading');
    setErrorMessage(null);
    try {
      const res = await fetch(API_ROUTES.CALENDAR_FEED_LINK, {
        method: 'GET',
        credentials: 'same-origin',
      });
      let json: {
        success?: boolean;
        data?: { httpsUrl?: string; webcalUrl?: string };
        error?: string;
      } = {};
      try {
        json = await res.json();
      } catch {
        json = {};
      }
      if (!res.ok || !json.success || !json.data?.httpsUrl) {
        setErrorMessage(json.error ?? 'Something went wrong. Try again.');
        setStep('error');
        return;
      }

      const httpsUrl = json.data.httpsUrl;
      const target = json.data.webcalUrl?.trim() || httpsUrl;

      onConfirm?.();

      // Hand off to the device/calendar app. `await fetch` breaks the strict
      // “user gesture” chain, so `window.open` may return null; we fall back to
      // `location.assign`. Either way we must close the modal — the old branch
      // returned early without `onClose()`, which left the spinner up when users
      // came back to this tab.
      const opened = window.open(target, '_blank', 'noopener,noreferrer');
      if (!opened) {
        window.location.assign(target);
      }

      queueMicrotask(() => {
        onClose();
      });
    } catch {
      setErrorMessage('Could not connect. Check your network and try again.');
      setStep('error');
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="" maxWidth="sm">
      <div className="-mt-2 space-y-6 text-left">
        <header className="border-b border-white/10 pb-4">
          <div className="flex min-w-0 items-center gap-3 sm:gap-4">
            <h2
              id="sync-calendar-modal-title"
              className="text-lg font-black leading-none tracking-tight text-white sm:text-xl"
            >
              Add to calendar
            </h2>
            {!isProSubscriber ? (
              <CrownIcon
                className="h-5 w-5 shrink-0 translate-y-0.5 text-amber-300 sm:h-6 sm:w-6 sm:translate-y-1"
                aria-hidden
              />
            ) : null}
          </div>
        </header>

        {step === 'intro' && (
          <>
            <div className="space-y-3 text-sm leading-relaxed text-gray-300">
              <p>
                This will sync your confirmed appointments to the calendar on
                your phone.
              </p>
              <p className="text-gray-400">
                Set it up once, and future confirmed bookings can show up there
                automatically.
              </p>
            </div>
            <div className="flex flex-col-reverse gap-3 border-t border-white/10 pt-5 sm:flex-row sm:justify-end">
              <Button
                type="button"
                variant="secondary"
                onClick={onClose}
                fullWidth
                className="sm:w-auto sm:min-w-[100px]"
              >
                Cancel
              </Button>
              {isProSubscriber ? (
                <Button
                  type="button"
                  variant="inverse"
                  onClick={() => void handleConfirm()}
                  fullWidth
                  className="font-semibold sm:w-auto sm:min-w-[140px]"
                >
                  Confirm
                </Button>
              ) : (
                <Button
                  type="button"
                  variant="inverse"
                  href={ROUTES.DASHBOARD.UPGRADE}
                  fullWidth
                  className="font-semibold sm:w-auto sm:min-w-[160px]"
                  icon={
                    <CrownIcon
                      className="h-4 w-4 shrink-0 text-neutral-900"
                      aria-hidden
                    />
                  }
                >
                  Upgrade to Pro
                </Button>
              )}
            </div>
          </>
        )}

        {step === 'loading' && (
          <div className="flex flex-col items-center gap-4 py-6 text-center">
            <div
              className="h-9 w-9 animate-spin rounded-full border-2 border-white/20 border-t-white/80"
              aria-hidden
            />
            <p className="text-sm text-gray-400">Opening your calendar…</p>
          </div>
        )}

        {step === 'error' && (
          <>
            <p className="text-sm text-rose-300" role="alert">
              {errorMessage}
            </p>
            <div className="flex flex-col-reverse gap-3 border-t border-white/10 pt-5 sm:flex-row sm:justify-end">
              <Button
                type="button"
                variant="secondary"
                onClick={onClose}
                fullWidth
                className="sm:w-auto sm:min-w-[100px]"
              >
                Close
              </Button>
              <Button
                type="button"
                variant="inverse"
                onClick={() => {
                  setStep('intro');
                  setErrorMessage(null);
                }}
                fullWidth
                className="font-semibold sm:w-auto sm:min-w-[120px]"
              >
                Try again
              </Button>
            </div>
          </>
        )}
      </div>
    </Modal>
  );
}
