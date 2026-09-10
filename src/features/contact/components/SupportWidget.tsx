'use client';

import { ROUTES } from '@/constants/routes';
import {
  ChatBubbleLeftRightIcon,
  XMarkIcon,
} from '@heroicons/react/24/outline';
import { usePathname } from 'next/navigation';
import { useCallback, useEffect, useId, useRef, useState } from 'react';
import { createPortal } from 'react-dom';

import { ContactForm } from './ContactForm';

const HIDDEN_PATHS = new Set<string>([
  ROUTES.CONTACT_PAGE,
  ROUTES.DASHBOARD.CONTACT,
]);

type SupportWidgetBaseProps = {
  instanceId?: string;
};

export type SupportWidgetProps =
  | ({ variant?: 'public' } & SupportWidgetBaseProps)
  | ({ variant: 'inApp'; accountEmail: string } & SupportWidgetBaseProps);

export function SupportWidget(props: SupportWidgetProps) {
  const variant = props.variant ?? 'public';
  const isInApp = variant === 'inApp';
  const accountEmail =
    props.variant === 'inApp' ? props.accountEmail : undefined;
  const instanceId =
    props.instanceId ?? (isInApp ? 'dashboard-support' : 'marketing-support');
  const pathname = usePathname();
  const [mounted, setMounted] = useState(false);
  const [open, setOpen] = useState(false);
  const overlayRef = useRef<HTMLDivElement>(null);
  const closeBtnRef = useRef<HTMLButtonElement>(null);
  const backdropRef = useRef<HTMLDivElement>(null);
  const titleId = useId();
  const panelId = `${instanceId}-panel`;

  useEffect(() => {
    setMounted(true);
  }, []);

  const closeHelp = useCallback(() => {
    const overlay = overlayRef.current;
    if (overlay) {
      overlay.hidden = true;
      overlay.style.display = 'none';
    }
    // Yield so the hide can paint before React unmounts the form.
    requestAnimationFrame(() => setOpen(false));
  }, []);

  const openHelp = useCallback(() => {
    const overlay = overlayRef.current;
    if (overlay) {
      overlay.hidden = false;
      overlay.style.display = '';
    }
    setOpen(true);
  }, []);

  useEffect(() => {
    if (!open) return;

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') closeHelp();
    };
    window.addEventListener('keydown', onKeyDown);

    const closeNow = (event: Event) => {
      event.preventDefault();
      event.stopPropagation();
      closeHelp();
    };

    const closeButton = closeBtnRef.current;
    const backdrop = backdropRef.current;
    closeButton?.addEventListener('touchstart', closeNow, { passive: false });
    closeButton?.addEventListener('pointerdown', closeNow);
    backdrop?.addEventListener('touchstart', closeNow, { passive: false });
    backdrop?.addEventListener('pointerdown', closeNow);

    return () => {
      window.removeEventListener('keydown', onKeyDown);
      closeButton?.removeEventListener('touchstart', closeNow);
      closeButton?.removeEventListener('pointerdown', closeNow);
      backdrop?.removeEventListener('touchstart', closeNow);
      backdrop?.removeEventListener('pointerdown', closeNow);
    };
  }, [closeHelp, open]);

  if (!mounted || HIDDEN_PATHS.has(pathname)) return null;

  return createPortal(
    <>
      {open ? (
        <div ref={overlayRef} className="fixed inset-0 z-[70]">
          <div
            ref={backdropRef}
            className="absolute inset-0 bg-black/50 md:bg-black/20"
            aria-hidden
          />
          <div
            id={panelId}
            role="dialog"
            aria-modal="true"
            aria-labelledby={titleId}
            className="absolute inset-x-0 bottom-0 flex max-h-[min(85dvh,40rem)] flex-col overflow-hidden rounded-t-2xl border border-white/10 bg-[#161616] shadow-2xl md:inset-auto md:bottom-[5.5rem] md:right-5 md:w-[22rem] md:rounded-2xl"
          >
            <div className="flex items-start justify-between gap-3 border-b border-white/10 px-4 py-3">
              <div className="min-w-0">
                <h2 id={titleId} className="text-base font-semibold text-white">
                  How can we help?
                </h2>
                <p className="mt-0.5 text-xs leading-snug text-zinc-500">
                  {accountEmail ? (
                    <>
                      We&apos;ll reply to{' '}
                      <span className="break-all text-zinc-400">
                        {accountEmail}
                      </span>
                    </>
                  ) : (
                    'We typically reply within 24 hours.'
                  )}
                </p>
              </div>
              <button
                ref={closeBtnRef}
                type="button"
                onClick={closeHelp}
                className="relative z-10 flex h-11 w-11 shrink-0 cursor-pointer items-center justify-center rounded-lg text-zinc-400 [touch-action:manipulation] hover:bg-white/5 hover:text-white"
                aria-label="Close help"
              >
                <XMarkIcon className="h-5 w-5" aria-hidden />
              </button>
            </div>
            <div className="min-h-0 overflow-y-auto px-4 py-4">
              {isInApp && accountEmail ? (
                <ContactForm
                  variant="inApp"
                  accountEmail={accountEmail}
                  compact
                  instanceId={instanceId}
                  onDone={closeHelp}
                />
              ) : (
                <ContactForm
                  variant="public"
                  compact
                  instanceId={instanceId}
                  onDone={closeHelp}
                />
              )}
            </div>
          </div>
        </div>
      ) : null}

      <button
        type="button"
        className={`fixed bottom-[max(1.25rem,calc(env(safe-area-inset-bottom)+1rem))] right-[max(1rem,env(safe-area-inset-right))] z-[80] h-14 w-14 cursor-pointer items-center justify-center rounded-full bg-white text-neutral-950 shadow-[0_8px_24px_rgba(0,0,0,0.45)] [touch-action:manipulation] hover:bg-zinc-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-white/40 focus-visible:ring-offset-2 focus-visible:ring-offset-[#0f0f0f] ${
          open ? 'hidden md:flex' : 'flex'
        }`}
        aria-label={open ? 'Close help' : 'Contact support'}
        aria-expanded={open}
        aria-controls={panelId}
        onClick={() => (open ? closeHelp() : openHelp())}
      >
        <ChatBubbleLeftRightIcon
          className={`h-6 w-6 ${open ? 'md:hidden' : ''}`}
          aria-hidden
        />
        <XMarkIcon
          className={`h-6 w-6 ${open ? 'hidden md:block' : 'hidden'}`}
          aria-hidden
        />
      </button>
    </>,
    document.body
  );
}
