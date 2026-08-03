'use client';

import {
  Button,
  GlassCard,
  RequiredLabel,
  WarningCallout,
} from '@/components/shared';
import { SLUG_MAX_LENGTH, sanitizeSlugInput } from '@/constants/slug';
import { UpdateBusinessLinkModal } from '@/features/dashboard/components/UpdateBusinessLinkModal';
import {
  ArrowTopRightOnSquareIcon,
  ClipboardDocumentIcon,
} from '@heroicons/react/24/outline';
import { CheckIcon } from '@heroicons/react/24/solid';
import { useRouter } from 'next/navigation';
import React, { useCallback, useEffect, useState } from 'react';

const APP_DOMAIN = 'myservicelink.app';

export interface SettingsYourLinkSectionProps {
  businessProfileId: string;
  hasSlug: boolean;
  existingSlug?: string;
  existingFullLink?: string;
}

export const SettingsYourLinkSection: React.FC<
  SettingsYourLinkSectionProps
> = ({ businessProfileId, hasSlug, existingSlug, existingFullLink }) => {
  const router = useRouter();
  const [showUpdateLinkModal, setShowUpdateLinkModal] = useState(false);
  const [customSlugInput, setCustomSlugInput] = useState('');
  const [isUpdating, setIsUpdating] = useState(false);
  const [slugError, setSlugError] = useState('');
  const [copied, setCopied] = useState(false);
  const [linkGenerated, setLinkGenerated] = useState(hasSlug);
  const [generatedSlug, setGeneratedSlug] = useState(existingSlug || '');

  useEffect(() => {
    if (!hasSlug || !existingSlug) return;
    setGeneratedSlug(existingSlug);
    setLinkGenerated(true);
  }, [hasSlug, existingSlug, existingFullLink]);

  const currentSlug = linkGenerated ? generatedSlug : customSlugInput || '';
  const rawLinkForCopy = linkGenerated
    ? existingFullLink || `${APP_DOMAIN}/${currentSlug}`
    : `${APP_DOMAIN}/${currentSlug}`;
  const fullLinkForCopy = /^https?:\/\//i.test(rawLinkForCopy)
    ? rawLinkForCopy
    : `https://${rawLinkForCopy.replace(/^\/+/, '')}`;
  const displayLink = fullLinkForCopy.replace(/^https?:\/\//i, '');

  const handleCopyLink = useCallback(() => {
    if (!fullLinkForCopy) return;
    const textarea = document.createElement('textarea');
    textarea.value = fullLinkForCopy;
    document.body.appendChild(textarea);
    textarea.select();
    try {
      const successful = document.execCommand('copy');
      if (successful) {
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      }
    } catch (err) {
      console.error('[ACTION] Could not copy text:', err);
    } finally {
      document.body.removeChild(textarea);
    }
  }, [fullLinkForCopy]);

  const handleViewProfile = useCallback(() => {
    if (!currentSlug) return;
    const isDevelopment = window.location.hostname === 'localhost';
    const profileUrl = isDevelopment
      ? `http://localhost:3000/${currentSlug}`
      : `https://myservicelink.app/${currentSlug}`;
    window.open(profileUrl, '_blank', 'noopener,noreferrer');
  }, [currentSlug]);

  const handleSaveSlug = async () => {
    setIsUpdating(true);
    setSlugError('');
    try {
      const response = await fetch('/api/business-profile/slug', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          businessProfileId,
          slugInput: sanitizeSlugInput(customSlugInput),
        }),
      });
      const result = await response.json();
      if (!result.success) {
        setSlugError(result.error ?? 'Something went wrong.');
        return;
      }
      setGeneratedSlug(result.data.slug);
      setLinkGenerated(true);
    } catch {
      setSlugError('Something went wrong. Please try again.');
    } finally {
      setIsUpdating(false);
    }
  };

  return (
    <section className="w-full min-w-0">
      <UpdateBusinessLinkModal
        isOpen={showUpdateLinkModal}
        onClose={() => setShowUpdateLinkModal(false)}
        appDomain={APP_DOMAIN}
        currentSlug={generatedSlug}
        businessProfileId={businessProfileId}
        onSaved={({ slug }) => {
          setGeneratedSlug(slug);
          router.refresh();
        }}
      />

      <div className="mb-2.5 flex items-center justify-between gap-3 min-w-0">
        <div className="flex min-w-0 flex-wrap items-center gap-2 sm:gap-3">
          <h2 className="text-base font-semibold text-white">Your link</h2>
          {!linkGenerated && (
            <RequiredLabel title="Add a link to share your profile" />
          )}
        </div>
        {linkGenerated ? (
          <button
            type="button"
            onClick={handleViewProfile}
            className="shrink-0 cursor-pointer rounded-lg p-2.5 text-gray-400 transition-colors hover:bg-white/[0.06] hover:text-white"
            aria-label="Open live profile in a new tab"
          >
            <ArrowTopRightOnSquareIcon className="h-5 w-5" />
          </button>
        ) : null}
      </div>

      <GlassCard
        padding="none"
        rounded="rounded-2xl"
        blurColor="bg-zinc-500"
        showBlur={true}
        className="w-full min-w-0 p-4 text-left"
      >
        {!linkGenerated ? (
          <div className="mb-4 min-w-0">
            <WarningCallout>
              You need a link so customers can find and book you. Add one below.
            </WarningCallout>
          </div>
        ) : null}

        <p className="text-sm text-gray-400 mb-4 leading-relaxed">
          {linkGenerated
            ? 'Share this URL with customers. QR code coming soon.'
            : 'The link you share with customers. Create one below.'}
        </p>

        {!linkGenerated ? (
          <div className="space-y-4 min-w-0">
            <div className="flex flex-col sm:flex-row rounded-xl border border-white/10 bg-white/[0.04] overflow-hidden focus-within:border-white/30 focus-within:ring-1 focus-within:ring-white/20 min-w-0">
              <span className="py-2.5 px-4 sm:py-3 text-gray-500 font-mono text-xs sm:text-sm border-b border-white/10 sm:border-b-0 sm:border-r flex-shrink-0">
                {APP_DOMAIN}/
              </span>
              <input
                type="text"
                value={customSlugInput}
                onChange={e =>
                  setCustomSlugInput(sanitizeSlugInput(e.target.value))
                }
                placeholder="my-business"
                disabled={isUpdating}
                maxLength={SLUG_MAX_LENGTH}
                className="flex-1 min-w-0 py-3 px-4 bg-transparent text-white font-mono text-base outline-none placeholder:text-gray-500"
                aria-label="Your link slug"
              />
            </div>
            {slugError ? (
              <p className="text-sm text-red-400">{slugError}</p>
            ) : null}
            <Button
              onClick={handleSaveSlug}
              variant="inverse"
              loading={isUpdating}
              disabled={isUpdating || !sanitizeSlugInput(customSlugInput)}
              className="w-full sm:w-auto"
            >
              {isUpdating ? 'Creating…' : 'Create link'}
            </Button>
          </div>
        ) : (
          <div className="min-w-0 space-y-2">
            <div className="rounded-xl border border-white/10 bg-white/[0.03] px-3.5 py-3 min-w-0">
              <div className="min-w-0 overflow-x-auto overflow-y-hidden [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
                <p
                  className="font-mono text-[13px] leading-snug text-gray-200 whitespace-nowrap pr-1 sm:text-sm"
                  title={fullLinkForCopy}
                >
                  {displayLink}
                </p>
              </div>
            </div>

            <div className="flex min-h-[44px] items-center justify-between gap-4 pt-0.5">
              <button
                type="button"
                onClick={handleCopyLink}
                className="inline-flex min-h-[44px] cursor-pointer items-center gap-2 py-2 text-sm text-gray-400 transition-colors hover:text-white"
              >
                {copied ? (
                  <CheckIcon className="h-4 w-4 shrink-0 text-emerald-500" />
                ) : (
                  <ClipboardDocumentIcon className="h-4 w-4 shrink-0 text-gray-500" />
                )}
                <span>{copied ? 'Copied' : 'Copy'}</span>
              </button>
              <button
                type="button"
                onClick={() => setShowUpdateLinkModal(true)}
                className="inline-flex min-h-[44px] shrink-0 cursor-pointer items-center py-2 text-sm text-gray-400 transition-colors hover:text-white"
              >
                Change link
              </button>
            </div>
          </div>
        )}
      </GlassCard>
    </section>
  );
};
