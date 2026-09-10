'use client';

import { ROUTES } from '@/constants/routes';
import {
  ChatBubbleLeftRightIcon,
  XMarkIcon,
} from '@heroicons/react/24/outline';
import { usePathname } from 'next/navigation';
import { useEffect, useId, useRef, useState } from 'react';

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
  const [open, setOpen] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);
  const titleId = useId();
  const panelId = `${instanceId}-panel`;

  useEffect(() => {
    if (!open) return;

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setOpen(false);
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [open]);

  useEffect(() => {
    if (!open) return;
    panelRef.current?.focus();
  }, [open]);

  if (HIDDEN_PATHS.has(pathname)) return null;

  return (
    <>
      {open ? (
        <button
          type="button"
          className="fixed inset-0 z-[60] cursor-pointer bg-black/50 sm:bg-black/20"
          aria-label="Close help"
          onClick={() => setOpen(false)}
        />
      ) : null}

      {open ? (
        <div
          ref={panelRef}
          id={panelId}
          role="dialog"
          aria-modal="true"
          aria-labelledby={titleId}
          tabIndex={-1}
          className="fixed inset-x-0 bottom-0 z-[70] flex max-h-[min(85dvh,40rem)] flex-col overflow-hidden rounded-t-2xl border border-white/10 bg-[#161616] shadow-2xl outline-none sm:inset-auto sm:bottom-[5.5rem] sm:right-5 sm:w-[22rem] sm:rounded-2xl"
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
              type="button"
              onClick={() => setOpen(false)}
              className="cursor-pointer rounded-lg p-1.5 text-zinc-500 transition-colors hover:bg-white/5 hover:text-white"
              aria-label="Close help"
            >
              <XMarkIcon className="h-5 w-5" aria-hidden />
            </button>
          </div>
          <div className="min-h-0 overflow-y-auto px-4 py-4 pb-20 sm:pb-4">
            {isInApp && accountEmail ? (
              <ContactForm
                variant="inApp"
                accountEmail={accountEmail}
                compact
                instanceId={instanceId}
                onDone={() => setOpen(false)}
              />
            ) : (
              <ContactForm
                variant="public"
                compact
                instanceId={instanceId}
                onDone={() => setOpen(false)}
              />
            )}
          </div>
        </div>
      ) : null}

      <button
        type="button"
        className="fixed bottom-[max(1.25rem,calc(env(safe-area-inset-bottom)+1rem))] right-[max(1rem,env(safe-area-inset-right))] z-[70] flex h-14 w-14 cursor-pointer items-center justify-center rounded-full bg-white text-neutral-950 shadow-[0_8px_24px_rgba(0,0,0,0.45)] transition-transform hover:bg-zinc-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-white/40 focus-visible:ring-offset-2 focus-visible:ring-offset-[#0f0f0f] active:scale-[0.98]"
        aria-label={open ? 'Close help' : 'Contact support'}
        aria-expanded={open}
        aria-controls={panelId}
        onClick={() => setOpen(current => !current)}
      >
        {open ? (
          <XMarkIcon className="h-6 w-6" aria-hidden />
        ) : (
          <ChatBubbleLeftRightIcon className="h-6 w-6" aria-hidden />
        )}
      </button>
    </>
  );
}
