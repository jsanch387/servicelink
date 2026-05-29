'use client';

import {
  Button,
  GlassCard,
  RequiredLabel,
  WarningCallout,
} from '@/components/shared';
import { IOS_APP_STORE_URL } from '@/constants/appStore';
import { ROUTES } from '@/constants/routes';
import { SLUG_MAX_LENGTH, sanitizeSlugInput } from '@/constants/slug';
import { DeleteAccountSection } from '@/features/account';
import { useAuth } from '@/features/auth';
import { CompleteBusinessProfile } from '@/features/business-profile/types/businessProfile';
import type { PlanId } from '@/features/pricing';
import { PlanSection, ProWelcomeModal } from '@/features/pricing';
import { PRO_WELCOME_MODAL_SEEN_KEY } from '@/features/pricing/types';
import {
  ArrowRightStartOnRectangleIcon,
  ArrowTopRightOnSquareIcon,
  ChevronRightIcon,
  ClipboardDocumentIcon,
  DevicePhoneMobileIcon,
  EnvelopeIcon,
} from '@heroicons/react/24/outline';
import { CheckIcon } from '@heroicons/react/24/solid';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import React, { useCallback, useEffect, useState } from 'react';
import { UpdateBusinessLinkModal } from './UpdateBusinessLinkModal';

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
  /** Current plan from profiles.subscription_tier + period end. */
  planId?: PlanId;
  /** Stripe subscription status (active, past_due, unpaid, etc.) for Pro users. */
  subscriptionStatus?: string | null;
  /** ISO timestamp for next billing period end (paying Pro); shown as “Renews on …” or “Access until …”. */
  subscriptionCurrentPeriodEnd?: string | null;
  /** True when Stripe has scheduled cancel at period end (no further renewals). */
  subscriptionCancelAtPeriodEnd?: boolean;
  /** Auth user's email — required for the typed-confirmation Delete Account flow. */
  accountEmail?: string;
}

interface SettingsContentProps {
  businessProfile: CompleteBusinessProfile;
  settingsData: SettingsData;
  /** True when redirected from Stripe with ?checkout=success (show Pro welcome once). */
  checkoutSuccess?: boolean;
}

export const SettingsContent: React.FC<SettingsContentProps> = ({
  businessProfile,
  settingsData,
  checkoutSuccess: checkoutSuccessProp = false,
}) => {
  const APP_DOMAIN = 'myservicelink.app';
  const planId = settingsData.planId ?? 'free';
  const subscriptionStatus = settingsData.subscriptionStatus ?? null;
  const [showProWelcomeModal, setShowProWelcomeModal] = useState(false);
  const [showUpdateLinkModal, setShowUpdateLinkModal] = useState(false);
  const [portalLoading, setPortalLoading] = useState(false);
  const searchParams = useSearchParams();
  const router = useRouter();
  const { signOut } = useAuth();
  const [logoutLoading, setLogoutLoading] = useState(false);

  const handleOpenPortal = useCallback(async () => {
    setPortalLoading(true);
    try {
      const res = await fetch('/api/stripe/create-portal-session', {
        method: 'POST',
      });
      const data = await res.json();
      if (data.success && data.url) {
        window.location.href = data.url;
        return;
      }
      setPortalLoading(false);
    } catch {
      setPortalLoading(false);
    }
  }, []);

  // Show Pro welcome modal when user returns from Stripe with ?checkout=success.
  // Read from URL on the client so we don't rely on server-passed props (avoids
  // hydration/cache issues when landing from Stripe redirect).
  useEffect(() => {
    const fromUrl = searchParams.get('checkout') === 'success';
    const shouldShow = fromUrl || checkoutSuccessProp;
    if (!shouldShow) return;
    try {
      const seen = window.localStorage.getItem(PRO_WELCOME_MODAL_SEEN_KEY);
      if (!seen) setShowProWelcomeModal(true);
    } catch {
      // ignore
    }
  }, [searchParams, checkoutSuccessProp]);

  const hasSlug = settingsData.slugData?.hasSlug || false;
  const existingSlug = settingsData.slugData?.slug;
  const existingFullLink = settingsData.slugData?.fullLink;

  const [customSlugInput, setCustomSlugInput] = useState('');
  const [isUpdating, setIsUpdating] = useState(false);
  const [slugError, setSlugError] = useState<string>('');
  const [copied, setCopied] = useState(false);
  const [linkGenerated, setLinkGenerated] = useState(hasSlug);
  const [generatedSlug, setGeneratedSlug] = useState(existingSlug || '');

  useEffect(() => {
    if (!hasSlug || !existingSlug) return;
    setGeneratedSlug(existingSlug);
    setLinkGenerated(true);
  }, [hasSlug, existingSlug, settingsData.slugData?.fullLink]);

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

  const handleLogout = useCallback(async () => {
    setLogoutLoading(true);
    try {
      const result = await signOut();
      if (result.success) router.push('/');
    } catch {
      // ignore
    } finally {
      setLogoutLoading(false);
    }
  }, [signOut, router]);

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

  const supportCardClass =
    'rounded-2xl border border-white/10 bg-white/[0.02] p-4 w-full min-w-0';

  return (
    <main className="flex-1 py-8 sm:py-10 px-4 sm:px-6 lg:px-8 overflow-x-hidden overflow-y-auto bg-[var(--dashboard-bg)] min-h-screen w-full">
      <ProWelcomeModal
        isOpen={showProWelcomeModal}
        onClose={() => setShowProWelcomeModal(false)}
      />
      <UpdateBusinessLinkModal
        isOpen={showUpdateLinkModal}
        onClose={() => setShowUpdateLinkModal(false)}
        appDomain={APP_DOMAIN}
        currentSlug={generatedSlug}
        businessProfileId={businessProfile.id}
        onSaved={({ slug }) => {
          setGeneratedSlug(slug);
          router.refresh();
        }}
      />
      <div className="max-w-2xl mx-auto w-full min-w-0">
        <div className="mb-10">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <h1 className="text-2xl font-black tracking-tight text-white sm:text-3xl">
                Settings
              </h1>
              <p className="mt-1 text-sm text-gray-500 sm:text-base">
                Manage your account settings.
              </p>
            </div>
            {IOS_APP_STORE_URL ? (
              <a
                href={IOS_APP_STORE_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex shrink-0 items-center gap-2 self-start rounded-lg border border-white/10 bg-white/[0.04] px-3.5 py-2 text-sm font-medium text-zinc-300 transition-colors hover:border-white/15 hover:bg-white/[0.06] hover:text-white"
              >
                <DevicePhoneMobileIcon
                  className="h-4 w-4 shrink-0"
                  aria-hidden
                />
                Get the iPhone app
              </a>
            ) : null}
          </div>
        </div>

        <div className="space-y-8 w-full min-w-0">
          {/* Payment failed — subscription still exists in Stripe but access is paused */}
          {(subscriptionStatus === 'past_due' ||
            subscriptionStatus === 'unpaid') && (
            <div className="rounded-xl border border-amber-500/30 bg-amber-500/10 p-4">
              <p className="text-amber-200 text-sm font-medium mb-3">
                We couldn&apos;t charge your card. Please update your payment
                method to restore Pro access.
              </p>
              <Button
                type="button"
                variant="inverse"
                onClick={handleOpenPortal}
                loading={portalLoading}
                disabled={portalLoading}
                className="w-full sm:w-auto"
              >
                Update payment method
              </Button>
            </div>
          )}

          {/* Subscription plan */}
          <PlanSection
            planId={planId}
            subscriptionCurrentPeriodEnd={
              settingsData.subscriptionCurrentPeriodEnd ?? null
            }
            subscriptionCancelAtPeriodEnd={
              settingsData.subscriptionCancelAtPeriodEnd === true
            }
            subscriptionStatus={subscriptionStatus}
          />

          {/* Your link */}
          <section className="w-full min-w-0">
            <div className="mb-3 flex items-center justify-between gap-3 min-w-0">
              <div className="flex min-w-0 flex-wrap items-center gap-2 sm:gap-3">
                <h2 className="text-lg sm:text-xl font-semibold text-white">
                  Your Link
                </h2>
                {!linkGenerated && (
                  <RequiredLabel title="Add a link to share your profile" />
                )}
              </div>
              {linkGenerated && (
                <button
                  type="button"
                  onClick={handleViewProfile}
                  className="shrink-0 cursor-pointer rounded-lg p-2.5 text-gray-400 transition-colors hover:bg-white/[0.06] hover:text-white"
                  aria-label="Open live profile in a new tab"
                >
                  <ArrowTopRightOnSquareIcon className="h-5 w-5" />
                </button>
              )}
            </div>
            <GlassCard
              padding="none"
              rounded="rounded-2xl"
              blurColor="bg-zinc-500"
              showBlur={true}
              className="w-full min-w-0 p-4 text-left"
            >
              {!linkGenerated && (
                <div className="mt-3 mb-6 min-w-0">
                  <WarningCallout>
                    You need a link so customers can find and book you. Add one
                    below.
                  </WarningCallout>
                </div>
              )}
              <p className="text-sm text-gray-400 mt-1 mb-4 leading-relaxed">
                {linkGenerated
                  ? 'Share this URL or open your public page from the icon above.'
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
                  {slugError && (
                    <p className="text-sm text-red-400">{slugError}</p>
                  )}
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

          {/* Support */}
          <section className="w-full min-w-0">
            <h2 className="mb-3 text-lg sm:text-xl font-semibold text-white">
              Support
            </h2>
            <div className={supportCardClass}>
              <p className="text-sm text-gray-400 mb-6">
                Questions or feedback? We reply within 24 hours.
              </p>
              <Link
                href={ROUTES.DASHBOARD.CONTACT}
                className="inline-flex items-center gap-3 rounded-xl border border-white/10 bg-white/[0.04] px-4 py-3 w-full sm:w-auto hover:bg-white/[0.06] hover:border-white/15 transition-colors group"
              >
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-white/5 group-hover:bg-white/10">
                  <EnvelopeIcon className="h-4 w-4 text-gray-400 group-hover:text-white" />
                </div>
                <div className="text-left min-w-0 flex-1">
                  <p className="text-xs text-gray-500">Contact</p>
                  <p className="text-sm font-medium text-white">
                    Send us a message
                  </p>
                </div>
                <ChevronRightIcon className="h-4 w-4 shrink-0 text-gray-500 group-hover:text-white" />
              </Link>
            </div>
          </section>

          <div className="border-t border-white/10 pt-8 flex w-full flex-col items-start gap-4">
            {settingsData.accountEmail ? (
              <DeleteAccountSection accountEmail={settingsData.accountEmail} />
            ) : null}
            <Button
              type="button"
              variant="secondary"
              size="sm"
              onClick={handleLogout}
              loading={logoutLoading}
              disabled={logoutLoading}
              icon={
                <ArrowRightStartOnRectangleIcon
                  className="h-4 w-4"
                  aria-hidden
                />
              }
              className="w-full sm:w-auto min-w-[7.5rem]"
            >
              Log out
            </Button>
          </div>
        </div>
      </div>
    </main>
  );
};
