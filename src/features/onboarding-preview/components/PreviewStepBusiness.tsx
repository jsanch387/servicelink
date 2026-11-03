'use client';

import { Button, Input, PhoneInput } from '@/components/shared';
import { sanitizeSlugInput } from '@/constants/slug';
import { CheckIcon } from '@heroicons/react/24/solid';
import { useEffect, useState } from 'react';
import {
  bookingLinkLabel,
  resolvePreviewSlug,
  slugFromBusinessName,
  type SlugPreviewResult,
} from '../slugPreview';
import { PreviewActionBar } from './PreviewActionBar';

interface PreviewStepBusinessProps {
  compact: boolean;
  businessName: string;
  slugEdited: boolean;
  customSlug: string;
  phone: string;
  saving?: boolean;
  error?: string | null;
  checkAvailability?: (slug: string) => Promise<SlugPreviewResult>;
  onBusinessName: (value: string) => void;
  onSlugEdited: (edited: boolean, slug: string) => void;
  onPhone: (digits: string) => void;
  onBack: () => void;
  onFinish: (slug: string) => void;
}

export function PreviewStepBusiness({
  compact,
  businessName,
  slugEdited,
  customSlug,
  phone,
  saving = false,
  error,
  checkAvailability,
  onBusinessName,
  onSlugEdited,
  onPhone,
  onBack,
  onFinish,
}: PreviewStepBusinessProps) {
  const source = slugEdited ? customSlug : slugFromBusinessName(businessName);
  const immediate = resolvePreviewSlug(source);
  const [settled, setSettled] = useState<SlugPreviewResult>(
    checkAvailability ? { state: 'idle' } : immediate
  );
  const [checking, setChecking] = useState(false);
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(source);

  useEffect(() => {
    let cancelled = false;
    const next = resolvePreviewSlug(source);
    if (next.state === 'idle') {
      setChecking(false);
      setSettled(next);
      return;
    }
    setChecking(true);
    const timer = window.setTimeout(() => {
      if (!checkAvailability) {
        if (!cancelled) {
          setSettled(resolvePreviewSlug(source));
          setChecking(false);
        }
        return;
      }
      void checkAvailability(source).then(result => {
        if (cancelled) return;
        setSettled(result);
        setChecking(false);
      });
    }, 400);
    return () => {
      cancelled = true;
      window.clearTimeout(timer);
    };
  }, [source, checkAvailability]);

  const active = checkAvailability ? settled : immediate;
  const resolvedSlug =
    checking && checkAvailability
      ? source
      : active.state === 'taken'
        ? active.suggestion
        : active.state === 'free'
          ? active.slug
          : source;
  const displaySlug = resolvedSlug || 'your-link';
  const phoneComplete = phone.length === 0 || phone.length === 10;
  const canFinish =
    businessName.trim().length > 0 &&
    !checking &&
    !saving &&
    settled.state !== 'idle' &&
    phoneComplete;

  const openEditor = () => {
    setDraft(resolvedSlug || source);
    setEditing(true);
  };

  const commitDraft = (value: string) => {
    const next = sanitizeSlugInput(value).replace(/^-+|-+$/g, '');
    setDraft(next);
    onSlugEdited(true, next);
  };

  return (
    <div className="onboarding-preview-rise">
      <p className="text-sm text-white/60">Step 2 of 2</p>
      <div className="mt-2 flex gap-1" aria-hidden>
        <div className="h-1 flex-1 rounded-full bg-white/30" />
        <div className="h-1 flex-1 rounded-full bg-white" />
      </div>

      <h1
        className={
          compact
            ? 'mt-6 text-2xl font-bold tracking-tight text-white'
            : 'mt-6 text-xl font-bold tracking-tight text-white sm:text-2xl md:text-3xl'
        }
      >
        What&apos;s your business called?
      </h1>

      <div className="mt-6 space-y-6 rounded-3xl border border-white/[0.08] bg-white/[0.03] p-4">
        <Input
          label="Business name"
          placeholder="e.g. Mike's Detailing"
          value={businessName}
          onChange={onBusinessName}
          required
          autoComplete="organization"
        />

        <div>
          <p className="mb-2 text-sm font-medium text-white">
            Your booking link
          </p>
          <div className="flex min-h-11 items-center gap-2 rounded-lg border border-white/15 bg-white/[0.04] px-3.5">
            {editing ? (
              <>
                <span className="shrink-0 text-sm text-white/45">
                  myservicelink.app/
                </span>
                <input
                  autoFocus
                  value={draft}
                  onChange={event => commitDraft(event.target.value)}
                  aria-label="Booking link"
                  className="min-w-0 flex-1 bg-transparent text-sm text-white outline-none"
                />
                <button
                  type="button"
                  onClick={() => setEditing(false)}
                  className="cursor-pointer text-sm font-medium text-white"
                >
                  Done
                </button>
              </>
            ) : (
              <>
                <p className="min-w-0 flex-1 truncate text-sm">
                  <span className="text-white/45">myservicelink.app/</span>
                  <span className="text-white">{displaySlug}</span>
                </p>
                {settled.state !== 'idle' && !checking ? (
                  <CheckIcon
                    className="h-4 w-4 shrink-0 text-emerald-400"
                    aria-label="Available"
                  />
                ) : null}
                <button
                  type="button"
                  onClick={openEditor}
                  className="cursor-pointer text-sm font-medium text-white/80 hover:text-white"
                >
                  Edit
                </button>
              </>
            )}
          </div>
          <div className="mt-2 space-y-1" aria-live="polite">
            {checking ? (
              <p className="text-sm text-white/60">Checking availability…</p>
            ) : null}
            {!checking && settled.state === 'taken' ? (
              <p className="text-sm text-white/70">
                {settled.typed} is taken. Your link is{' '}
                {bookingLinkLabel(settled.suggestion)}.
              </p>
            ) : null}
            <p className="text-sm text-white/60">
              You can change this anytime.
            </p>
          </div>
        </div>

        <div>
          <div className="mb-2 flex items-baseline justify-between gap-3">
            <span className="text-sm font-medium text-white">
              Business phone
            </span>
            <span className="text-sm text-white/50">Optional</span>
          </div>
          <PhoneInput
            label=""
            value={phone}
            onChange={onPhone}
            placeholder="(555) 123-4567"
          />
          <p className="mt-2 text-sm text-white/60">
            So customers can call or text you. Shown on your booking page.
          </p>
        </div>
      </div>

      {error ? <p className="mt-4 text-sm text-red-300">{error}</p> : null}

      <PreviewActionBar compact={compact}>
        <div
          className={
            compact
              ? 'flex flex-col gap-2'
              : 'flex flex-col gap-2 sm:flex-row sm:items-center'
          }
        >
          <Button
            type="button"
            variant="ghost"
            size="md"
            onClick={onBack}
            className={compact ? 'w-full' : 'w-full sm:w-auto'}
          >
            Back
          </Button>
          <Button
            type="button"
            variant="primary"
            size="md"
            loading={saving}
            disabled={!canFinish}
            onClick={() => onFinish(resolvedSlug)}
            className={
              compact
                ? 'w-full'
                : 'w-full sm:ml-auto sm:w-auto sm:min-w-[160px]'
            }
          >
            Finish setup
          </Button>
        </div>
      </PreviewActionBar>
    </div>
  );
}
