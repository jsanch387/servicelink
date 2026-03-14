'use client';

import { SLUG_MAX_LENGTH } from '@/constants/slug';
import {
  Button,
  GlassCard,
  RequiredLabel,
  WarningCallout,
} from '@/components/shared';
import { CompleteBusinessProfile } from '@/features/business-profile/types/businessProfile';
import { PlanSection } from '@/features/pricing';
import type { PlanId } from '@/features/pricing';
import {
  ArrowTopRightOnSquareIcon,
  ClipboardDocumentIcon,
  EnvelopeIcon,
} from '@heroicons/react/24/outline';
import { CheckIcon } from '@heroicons/react/24/solid';
import React, { useCallback, useState } from 'react';

interface SettingsData {
  businessProfile: {
    id: string;
    business_name: string;
    business_type: string | null;
    service_area: string | null;
    bio: string | null;
    created_at: string;
    updated_at: string;
  };
  slugData: {
    hasSlug: boolean;
    slug?: string;
    fullLink?: string;
  } | null;
  /** Current plan from profiles.subscription_tier. */
  planId?: PlanId;
}

interface SettingsContentProps {
  businessProfile: CompleteBusinessProfile;
  settingsData: SettingsData;
}

export const SettingsContent: React.FC<SettingsContentProps> = ({
  businessProfile,
  settingsData,
}) => {
  const APP_DOMAIN = 'myservicelink.app';

  const hasSlug = settingsData.slugData?.hasSlug || false;
  const existingSlug = settingsData.slugData?.slug;
  const existingFullLink = settingsData.slugData?.fullLink;

  const [customSlugInput, setCustomSlugInput] = useState('');
  const [isUpdating, setIsUpdating] = useState(false);
  const [slugError, setSlugError] = useState<string>('');
  const [copied, setCopied] = useState(false);
  const [linkGenerated, setLinkGenerated] = useState(hasSlug);
  const [generatedSlug, setGeneratedSlug] = useState(existingSlug || '');

  const currentSlug = linkGenerated ? generatedSlug : customSlugInput || '';
  const fullLinkForCopy = linkGenerated
    ? existingFullLink || `https://${APP_DOMAIN}/${currentSlug}`
    : `https://${APP_DOMAIN}/${currentSlug}`;
  const displayLink = fullLinkForCopy.replace(/^https?:\/\//, '');

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
          businessProfileId: businessProfile.id,
          slugInput: customSlugInput.trim().toLowerCase(),
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

  const supportCardClass =
    'rounded-2xl border border-white/10 bg-white/[0.02] p-4 w-full min-w-0';

  return (
    <main className="flex-1 py-8 sm:py-10 px-4 sm:px-6 lg:px-8 overflow-x-hidden overflow-y-auto bg-[var(--dashboard-bg)] min-h-screen w-full">
      <div className="max-w-2xl mx-auto w-full min-w-0">
        <div className="mb-10">
          <h1 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">
            Settings
          </h1>
          <p className="text-gray-400 text-sm sm:text-base mt-1">
            Manage your share link and get support
          </p>
        </div>

        <div className="space-y-8 w-full min-w-0">
          {/* Subscription plan */}
          <PlanSection planId={settingsData.planId ?? 'free'} />

          {/* Custom link */}
          <GlassCard
            padding="none"
            rounded="rounded-2xl"
            blurColor="bg-zinc-500"
            showBlur={true}
            className="w-full min-w-0 p-4 text-left"
          >
            <div className="flex flex-wrap items-center gap-2 sm:gap-3 min-w-0">
              <h2 className="text-lg sm:text-xl font-bold text-white">
                Custom link
              </h2>
              {!linkGenerated && (
                <RequiredLabel title="Create a link to share your profile" />
              )}
            </div>
            {!linkGenerated && (
              <div className="mt-3 mb-6 min-w-0">
                <WarningCallout>
                  You need a custom link so customers can find and book you.
                  Create one below.
                </WarningCallout>
              </div>
            )}
            <p className="text-sm text-gray-400 mt-1 mb-6">
              {linkGenerated
                ? 'This is your public link. Copy and share it so customers can find you and book.'
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
                    onChange={e => setCustomSlugInput(e.target.value)}
                    placeholder="my-business"
                    disabled={isUpdating}
                    maxLength={SLUG_MAX_LENGTH}
                    className="flex-1 min-w-0 py-3 px-4 bg-transparent text-white font-mono text-base outline-none placeholder:text-gray-500"
                    aria-label="Custom link slug"
                  />
                </div>
                {slugError && (
                  <p className="text-sm text-red-400">{slugError}</p>
                )}
                <Button
                  onClick={handleSaveSlug}
                  variant="inverse"
                  loading={isUpdating}
                  disabled={isUpdating || !customSlugInput.trim()}
                  className="w-full sm:w-auto"
                >
                  {isUpdating ? 'Creating…' : 'Create link'}
                </Button>
              </div>
            ) : (
              <div className="space-y-4 min-w-0">
                <div className="flex flex-col sm:flex-row sm:items-center gap-3 min-w-0">
                  <div className="flex-1 min-w-0 rounded-xl border border-white/10 bg-white/[0.04] py-3 px-4 overflow-hidden">
                    <p
                      className="font-mono text-sm text-gray-200 truncate"
                      title={fullLinkForCopy}
                    >
                      {displayLink}
                    </p>
                  </div>
                  <Button
                    type="button"
                    onClick={handleCopyLink}
                    variant="inverse"
                    className="w-full sm:w-auto sm:flex-shrink-0"
                    icon={
                      copied ? (
                        <CheckIcon className="h-4 w-4 text-emerald-600" />
                      ) : (
                        <ClipboardDocumentIcon className="h-4 w-4" />
                      )
                    }
                  >
                    {copied ? 'Copied' : 'Copy'}
                  </Button>
                </div>
                <button
                  type="button"
                  onClick={handleViewProfile}
                  className="inline-flex items-center gap-2 text-sm text-gray-400 hover:text-white transition-colors"
                >
                  <ArrowTopRightOnSquareIcon className="h-4 w-4" />
                  View my profile
                </button>
              </div>
            )}
          </GlassCard>

          {/* Support */}
          <div className={supportCardClass}>
            <h2 className="text-base font-semibold text-white">Support</h2>
            <p className="text-sm text-gray-400 mt-1 mb-6">
              Questions or feedback? We reply within 24 hours.
            </p>
            <a
              href="mailto:app.servicelink@gmail.com"
              className="inline-flex items-center gap-3 rounded-xl border border-white/10 bg-white/[0.04] px-4 py-3 w-full sm:w-auto hover:bg-white/[0.06] hover:border-white/15 transition-colors group"
            >
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-white/5 group-hover:bg-white/10">
                <EnvelopeIcon className="h-4 w-4 text-gray-400 group-hover:text-white" />
              </div>
              <div className="text-left min-w-0">
                <p className="text-xs text-gray-500">Email</p>
                <p className="text-sm font-medium text-white truncate">
                  app.servicelink@gmail.com
                </p>
              </div>
            </a>
          </div>
        </div>
      </div>
    </main>
  );
};
