'use client';

import { Button } from '@/components/shared';
import { MARKETING_IMAGES } from '@/constants/marketingImages';
import { API_ROUTES } from '@/constants/routes';
import { XMarkIcon } from '@heroicons/react/24/outline';
import Image from 'next/image';
import { useEffect, useRef, useState } from 'react';

import {
  SUPPORT_PRESENCE_FALLBACK,
  getSupportPresence,
  type SupportPresence,
} from '../utils/getSupportPresence';
import {
  getAuthenticatedContactFormFieldErrors,
  getContactFormFieldErrors,
} from '../utils/validateContactFormFields';

const DEFAULT_TOPIC = 'other' as const;

const FIELD_CLASS =
  'min-h-11 w-full appearance-none rounded-xl border border-zinc-200 bg-white px-3.5 py-2.5 text-base text-neutral-950 outline-none placeholder:text-zinc-400 focus:border-zinc-400';

const LABEL_CLASS = 'mb-1.5 block text-sm font-medium text-neutral-700';

type ContactChatBaseProps = {
  onClose?: () => void;
  instanceId?: string;
};

export type ContactChatProps =
  | ({ variant?: 'public' } & ContactChatBaseProps)
  | ({ variant: 'inApp'; accountEmail: string } & ContactChatBaseProps);

export function ContactChat(props: ContactChatProps) {
  const isInApp = props.variant === 'inApp';
  const accountEmail =
    props.variant === 'inApp' ? props.accountEmail : undefined;
  const onClose = props.onClose;
  const instanceId = props.instanceId ?? 'contact-chat';

  const [presence, setPresence] = useState<SupportPresence>(() =>
    typeof window === 'undefined'
      ? SUPPORT_PRESENCE_FALLBACK
      : getSupportPresence(new Date())
  );
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [website, setWebsite] = useState('');
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [sentMessage, setSentMessage] = useState<string | null>(null);
  const [sentEmail, setSentEmail] = useState<string | null>(null);

  const listRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setPresence(getSupportPresence(new Date()));
  }, []);

  useEffect(() => {
    listRef.current?.scrollTo({ top: listRef.current.scrollHeight });
  }, [sentMessage, fieldErrors, submitError]);

  const handleSubmit = async () => {
    if (loading || sentMessage) return;

    const formPayload = isInApp
      ? { topic: DEFAULT_TOPIC, message, website: '' }
      : { email, topic: DEFAULT_TOPIC, message, website: '' };
    const clientErrors = isInApp
      ? getAuthenticatedContactFormFieldErrors(formPayload)
      : getContactFormFieldErrors(formPayload);

    if (clientErrors) {
      setFieldErrors(clientErrors);
      setSubmitError(null);
      return;
    }

    setFieldErrors({});
    setSubmitError(null);
    setLoading(true);

    try {
      const res = await fetch(API_ROUTES.CONTACT, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: isInApp ? 'include' : 'omit',
        body: JSON.stringify(formPayload),
      });
      const data = (await res.json()) as {
        success?: boolean;
        error?: string;
      };

      if (!res.ok || !data.success) {
        setSubmitError(data.error ?? 'Something went wrong. Please try again.');
        return;
      }

      setSentMessage(message.trim());
      setSentEmail(accountEmail ?? email.trim());
      setMessage('');
    } catch {
      setSubmitError('Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const clearFieldError = (key: 'email' | 'message') => {
    setFieldErrors(prev => {
      if (!prev[key]) return prev;
      const next = { ...prev };
      delete next[key];
      return next;
    });
  };

  return (
    <div className="flex h-full min-h-0 w-full flex-1 flex-col bg-white">
      <header className="flex shrink-0 items-center gap-3 border-b border-zinc-200 px-4 py-3">
        <Image
          src={MARKETING_IMAGES.brand.favicon}
          alt=""
          width={40}
          height={40}
          className="h-10 w-10 shrink-0 rounded-full bg-white ring-1 ring-zinc-200"
        />
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold text-neutral-950">
            ServiceLink Support
          </p>
          <p className="truncate text-xs text-zinc-500">
            {presence.statusLabel}
          </p>
        </div>
        {onClose ? (
          <button
            type="button"
            onTouchEnd={event => {
              event.preventDefault();
              event.stopPropagation();
              onClose();
            }}
            onClick={event => {
              event.stopPropagation();
              onClose();
            }}
            className="relative z-10 flex h-11 w-11 shrink-0 cursor-pointer touch-manipulation items-center justify-center rounded-lg text-zinc-400 hover:bg-zinc-100 hover:text-neutral-950"
            style={{ touchAction: 'manipulation' }}
            aria-label="Close chat"
          >
            <XMarkIcon className="h-5 w-5" aria-hidden />
          </button>
        ) : null}
      </header>

      {sentMessage ? (
        <div
          ref={listRef}
          className="min-h-0 flex-1 space-y-3 overflow-y-auto overscroll-contain px-4 py-4 [-webkit-overflow-scrolling:touch]"
        >
          <UserBubble>{sentMessage}</UserBubble>
          <SupportBubble>
            We&apos;ll get back to you
            {sentEmail ? (
              <>
                {' '}
                at{' '}
                <span className="break-all font-medium text-neutral-950">
                  {sentEmail}
                </span>
              </>
            ) : null}
            .
          </SupportBubble>
        </div>
      ) : (
        <form
          className="relative flex min-h-0 flex-1 flex-col gap-4 px-4 py-4"
          onSubmit={event => {
            event.preventDefault();
            void handleSubmit();
          }}
          noValidate
        >
          <div
            className="absolute left-[-9999px] top-auto h-px w-px overflow-hidden"
            aria-hidden
          >
            <label htmlFor={`${instanceId}-fax`}>Fax</label>
            <input
              id={`${instanceId}-fax`}
              type="text"
              name="fax"
              tabIndex={-1}
              autoComplete="off"
              data-1p-ignore
              data-lpignore="true"
              value={website}
              onChange={event => setWebsite(event.target.value)}
            />
          </div>

          {isInApp ? (
            <p className="text-xs text-zinc-500">
              We&apos;ll reply to{' '}
              <span className="text-zinc-700">{accountEmail}</span>
            </p>
          ) : (
            <label className="block shrink-0">
              <span className={LABEL_CLASS}>Your email</span>
              <input
                type="email"
                name="email"
                autoComplete="email"
                inputMode="email"
                placeholder="you@example.com"
                required
                value={email}
                onChange={event => {
                  setEmail(event.target.value);
                  clearFieldError('email');
                }}
                className={FIELD_CLASS}
              />
              {fieldErrors.email ? (
                <p className="mt-1 text-xs text-red-600" role="alert">
                  {fieldErrors.email}
                </p>
              ) : null}
            </label>
          )}

          <label className="flex min-h-0 flex-1 flex-col">
            <span className={LABEL_CLASS}>Message</span>
            <textarea
              name="message"
              rows={5}
              maxLength={5000}
              placeholder="Tell us what you need — the more detail, the better we can help."
              required
              value={message}
              onChange={event => {
                setMessage(event.target.value);
                clearFieldError('message');
              }}
              className={`${FIELD_CLASS} min-h-[8rem] flex-1 resize-none`}
            />
            {fieldErrors.message ? (
              <p className="mt-1 text-xs text-red-600" role="alert">
                {fieldErrors.message}
              </p>
            ) : null}
          </label>

          {submitError ? (
            <p className="text-xs text-red-600" role="alert">
              {submitError}
            </p>
          ) : null}

          <Button
            type="submit"
            fullWidth
            loading={loading}
            disabled={loading}
            className="mt-auto min-h-11 shrink-0 !rounded-xl !bg-neutral-950 !text-white hover:!bg-neutral-800 focus-visible:!ring-offset-white"
          >
            {loading ? 'Sending' : 'Send message'}
          </Button>
        </form>
      )}
    </div>
  );
}

function SupportBubble({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex justify-start">
      <p className="max-w-[85%] rounded-2xl rounded-tl-md bg-white px-3.5 py-2.5 text-sm leading-relaxed text-neutral-800 shadow-sm ring-1 ring-zinc-200">
        {children}
      </p>
    </div>
  );
}

function UserBubble({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex justify-end">
      <p className="max-w-[85%] rounded-2xl rounded-tr-md bg-neutral-950 px-3.5 py-2.5 text-sm leading-relaxed text-white">
        {children}
      </p>
    </div>
  );
}
