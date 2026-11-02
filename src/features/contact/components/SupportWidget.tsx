'use client';

import { ROUTES } from '@/constants/routes';
import { ChatBubbleLeftRightIcon } from '@heroicons/react/24/outline';
import { usePathname } from 'next/navigation';
import { useCallback, useEffect, useId, useRef, useState } from 'react';
import { createPortal } from 'react-dom';

import { ContactChat } from './ContactChat';

const HIDDEN_PATHS = new Set<string>([
  ROUTES.CONTACT_PAGE,
  ROUTES.DASHBOARD.CONTACT,
]);

const CHAT_OPEN_CLASS = 'support-chat-open';

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
  const openRef = useRef(false);
  const cardRef = useRef<HTMLDivElement>(null);
  const fabRef = useRef<HTMLButtonElement>(null);
  const titleId = useId();

  const hideCardNow = useCallback(() => {
    const card = cardRef.current;
    if (!card) return;
    card.style.visibility = 'hidden';
    card.style.pointerEvents = 'none';
  }, []);

  const showCardNow = useCallback(() => {
    const card = cardRef.current;
    if (!card) return;
    card.style.visibility = '';
    card.style.pointerEvents = '';
  }, []);

  const closeChat = useCallback(() => {
    hideCardNow();
    openRef.current = false;
    setOpen(false);
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        if (!openRef.current) {
          document.documentElement.classList.remove(CHAT_OPEN_CLASS);
        }
      });
    });
  }, [hideCardNow]);

  const openChat = useCallback(() => {
    openRef.current = true;
    document.documentElement.classList.add(CHAT_OPEN_CLASS);
    showCardNow();
    setOpen(true);
  }, [showCardNow]);

  useEffect(() => {
    setMounted(true);
    return () => {
      document.documentElement.classList.remove(CHAT_OPEN_CLASS);
    };
  }, []);

  useEffect(() => {
    if (!open) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') closeChat();
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [open, closeChat]);

  useEffect(() => {
    if (!open) return;
    const onPointerDown = (event: PointerEvent) => {
      const target = event.target as Node;
      if (
        cardRef.current?.contains(target) ||
        fabRef.current?.contains(target)
      ) {
        return;
      }
      closeChat();
    };
    document.addEventListener('pointerdown', onPointerDown);
    return () => document.removeEventListener('pointerdown', onPointerDown);
  }, [open, closeChat]);

  if (!mounted || HIDDEN_PATHS.has(pathname)) return null;

  return createPortal(
    <>
      <div
        ref={cardRef}
        role="dialog"
        aria-modal={open}
        aria-labelledby={titleId}
        aria-hidden={!open}
        inert={!open}
        className={`fixed inset-x-3 bottom-[5.5rem] z-[70] flex h-[min(32rem,calc(100svh-8.5rem))] transform-gpu flex-col overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-2xl contain-paint [overscroll-behavior:contain] md:inset-x-auto md:right-5 md:h-[32rem] md:w-[22.5rem] ${
          open ? '' : 'invisible pointer-events-none'
        }`}
      >
        <span id={titleId} className="sr-only">
          ServiceLink Support
        </span>
        {isInApp && accountEmail ? (
          <ContactChat
            variant="inApp"
            accountEmail={accountEmail}
            instanceId={instanceId}
            onClose={closeChat}
          />
        ) : (
          <ContactChat
            variant="public"
            instanceId={instanceId}
            onClose={closeChat}
          />
        )}
      </div>

      <button
        ref={fabRef}
        type="button"
        className="fixed bottom-[max(1.25rem,calc(env(safe-area-inset-bottom)+1rem))] right-[max(1rem,env(safe-area-inset-right))] z-[80] flex h-14 w-14 cursor-pointer touch-manipulation items-center justify-center rounded-full bg-white text-neutral-950 shadow-[0_8px_24px_rgba(0,0,0,0.45)] hover:bg-zinc-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-white/40 focus-visible:ring-offset-2 focus-visible:ring-offset-[#0f0f0f]"
        style={{ touchAction: 'manipulation' }}
        aria-label={open ? 'Close chat' : 'Contact support'}
        aria-expanded={open}
        onClick={() => {
          if (open) closeChat();
          else openChat();
        }}
      >
        <ChatBubbleLeftRightIcon className="h-6 w-6" aria-hidden />
      </button>
    </>,
    document.body
  );
}
