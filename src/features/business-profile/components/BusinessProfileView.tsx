'use client';

import {
  Button,
  GlassCard,
  Modal,
  RequiredLabel,
  WarningCallout,
} from '@/components/shared';
import type { PublicBookingFlowLocale } from '@/constants/routes';
import { ROUTES } from '@/constants/routes';
import { ONBOARDING_PRO_MODAL_SEEN_KEY } from '@/features/pricing/types';
import type { PublicProfileReviewsSummary } from '@/features/reviews';
import { PublicActiveSaleMarqueeBanner } from '@/features/marketing/components/PublicActiveSaleMarqueeBanner';
import type { PublicActiveSale } from '@/features/marketing/types/publicActiveSale';
import type { CustomerSubscriptionPlan } from '@/features/subscriptions/types/customerSubscriptionPlan';
import {
  ArrowRightIcon,
  CheckCircleIcon,
  PencilIcon,
} from '@heroicons/react/24/outline';
import dynamic from 'next/dynamic';
import React, { useEffect, useState } from 'react';
import { CompleteBusinessProfile, EditMode } from '../types/businessProfile';
import type {
  PrimaryServiceArea,
  PublicServiceCoverage,
} from '../types/primaryServiceArea';
import { formatServiceCoverageLabel } from '../utils/primaryServiceArea';
import { ProfileCompletionTracker } from './ProfileCompletionTracker';
import { BusinessProfileReadView } from './BusinessProfileReadView';
import type { EditProfileTabId } from '../utils/editProfileTab';

const EditBusinessProfile = dynamic(() =>
  import('./edit/EditBusinessProfile').then(mod => mod.EditBusinessProfile)
);
const ProfileWelcomeModal = dynamic(() =>
  import('./ProfileWelcomeModal').then(mod => mod.ProfileWelcomeModal)
);
const TryProPostOnboardingModal = dynamic(() =>
  import('@/features/pricing/components/TryProPostOnboardingModal').then(
    mod => mod.TryProPostOnboardingModal
  )
);

type TabType = 'services' | 'subscriptions' | 'gallery' | 'bio' | 'reviews';

interface SlugData {
  hasSlug: boolean;
  slug?: string;
  fullLink?: string;
}

function parseCityState(serviceArea?: string | null): {
  city: string;
  state: string;
} {
  const value = serviceArea?.trim() ?? '';
  if (!value) return { city: '', state: '' };
  const [cityPart = '', statePart = ''] = value.split(',');
  return { city: cityPart.trim(), state: statePart.trim() };
}

interface BusinessProfileViewProps {
  businessProfile: CompleteBusinessProfile;
  initialMode?: EditMode;
  isPublic?: boolean; // New prop to indicate public viewing
  slugData?: SlugData; // Optional slug data for authenticated users
  /** When true, show verified badge on logo (Pro tier from owner profile). */
  showVerifiedBadge?: boolean;
  /** When true, user is on free tier (e.g. show upgrade CTA in portfolio at limit). */
  isFreeTier?: boolean;
  /** When true, user just landed from onboarding complete; may show one-time Try Pro modal (free only). */
  onboardingCompleteFromUrl?: boolean;
  /** Server-side, account-level flag for one-time Pro welcome helper modal. */
  showProfileWelcomeModalOnLoad?: boolean;
  /** Pro quote gate + accept_quote_req: show Request quote on public / owner preview header. */
  showRequestQuoteCta?: boolean;
  /**
   * Public profile only: owner still has Pro — show “starting at” for services with price options.
   * When false, public services list hides multi-price presentation (data may still exist in DB).
   */
  publicOwnerHasProForPriceOptions?: boolean;
  /**
   * Public profile: owner hit free lifetime public booking cap — banner + hide Select on services.
   */
  publicFreeBookingsCapReached?: boolean;
  /** Resolved booking-funnel locale for public profile + service links. */
  bookingFlowLocale?: PublicBookingFlowLocale;
  /** Ratings summary for header + Reviews tab; full list loads on tab click. */
  publicReviewSummary?: PublicProfileReviewsSummary | null;
  /** Slug for lazy reviews API (public profile + booking-link preview). */
  publicProfileSlug?: string;
  /** Live sale to announce on the public booking link (Pro owners only). */
  publicActiveSale?: PublicActiveSale | null;
  /**
   * Customer subscription plans for the public booking link.
   * Tab only renders when this list is non-empty.
   */
  publicSubscriptionPlans?: CustomerSubscriptionPlan[];
  /** Open this tab on first paint (e.g. after membership Checkout Done). */
  initialTab?: TabType;
  /** Stripe membership Checkout returned with cancel — show toast once. */
  membershipCheckoutCanceled?: boolean;
  /** Owner editor: full primary `business_service_areas` row (includes coords). */
  primaryServiceArea?: PrimaryServiceArea | null;
  /** Public booking link: city/state/radius only — no lat/lng. */
  publicServiceCoverage?: PublicServiceCoverage | null;
  /** Owner edit tabs: Photos / Details / Booking / Contact. */
  initialEditTab?: EditProfileTabId;
  /** Scroll and focus the shop address field after opening Booking. */
  focusShopAddress?: boolean;
}

export const BusinessProfileView: React.FC<BusinessProfileViewProps> = ({
  businessProfile: initialBusinessProfile,
  initialMode = 'view',
  isPublic = false,
  slugData,
  showVerifiedBadge = false,
  isFreeTier = false,
  onboardingCompleteFromUrl = false,
  showProfileWelcomeModalOnLoad = false,
  showRequestQuoteCta = false,
  publicOwnerHasProForPriceOptions = false,
  publicFreeBookingsCapReached = false,
  bookingFlowLocale = 'en',
  publicReviewSummary = null,
  publicProfileSlug,
  publicActiveSale = null,
  publicSubscriptionPlans = [],
  initialTab,
  initialEditTab,
  focusShopAddress = false,
  membershipCheckoutCanceled = false,
  primaryServiceArea: initialPrimaryServiceArea = null,
  publicServiceCoverage = null,
}) => {
  const [editMode, setEditMode] = useState<EditMode>(initialMode);
  const [businessProfile, setBusinessProfile] =
    useState<CompleteBusinessProfile>(initialBusinessProfile);
  const [isLoading, setIsLoading] = useState(false);
  const [showOnboardingProModal, setShowOnboardingProModal] = useState(false);
  const [showProfileWelcomeModal, setShowProfileWelcomeModal] = useState(false);
  const [showProfileChecklistModal, setShowProfileChecklistModal] =
    useState(false);
  const [primaryServiceArea, setPrimaryServiceArea] =
    useState<PrimaryServiceArea | null>(initialPrimaryServiceArea);
  const { city, state } = parseCityState(businessProfile.service_area);
  const coverageLabel =
    formatServiceCoverageLabel(
      publicServiceCoverage?.city ?? primaryServiceArea?.city ?? city,
      publicServiceCoverage?.stateCode ??
        primaryServiceArea?.stateCode ??
        state,
      publicServiceCoverage?.radiusMiles ?? primaryServiceArea?.radiusMiles
    ) ?? null;

  const completionChecks = [
    {
      label: 'Cover photo',
      done: Boolean(businessProfile.cover_image_url?.trim()),
    },
    { label: 'Logo', done: Boolean(businessProfile.logo_url?.trim()) },
    {
      label: 'Business name',
      done: Boolean(businessProfile.business_name?.trim()),
    },
    {
      label: 'Business type',
      done: Boolean(businessProfile.business_type?.trim()),
    },
    {
      label: 'Service area',
      done: Boolean(
        (primaryServiceArea?.city && primaryServiceArea?.stateCode) ||
          (publicServiceCoverage?.city && publicServiceCoverage?.stateCode) ||
          (city && state)
      ),
    },
    { label: 'Bio', done: Boolean(businessProfile.bio?.trim()) },
    {
      label: 'Phone',
      done: Boolean(businessProfile.phone_number_call?.trim()),
    },
    {
      label: 'At least 1 photo',
      done: (businessProfile.images?.length ?? 0) > 0,
    },
    {
      label: 'At least 1 service',
      done: (businessProfile.services?.length ?? 0) > 0,
    },
  ] as const;
  const isProfileComplete = completionChecks.every(item => item.done);
  const showProfileCompletionTracker =
    !isPublic && (editMode === 'edit' || !isProfileComplete);
  const profileCompletionTracker = showProfileCompletionTracker ? (
    <ProfileCompletionTracker
      checks={completionChecks}
      onViewChecklist={() => setShowProfileChecklistModal(true)}
      fullWidthOnLarge={editMode === 'view'}
    />
  ) : null;

  // Debug logging for public profiles
  useEffect(() => {
    if (isPublic) {
      // Public profile data loaded
    }
  }, [businessProfile, isPublic]);

  // Update edit mode when initialMode prop changes
  // For public profiles, always stay in view mode
  useEffect(() => {
    if (isPublic) {
      setEditMode('view');
    } else {
      setEditMode(initialMode);
    }
  }, [initialMode, isPublic]);

  // One-time Try Pro modal when user lands from onboarding complete (free tier only);
  // “Booking link is live” welcome runs after Try Pro closes (or immediately if Try Pro already seen).
  useEffect(() => {
    if (isPublic || !onboardingCompleteFromUrl || !isFreeTier) return;
    try {
      if (!window.localStorage.getItem(ONBOARDING_PRO_MODAL_SEEN_KEY)) {
        setShowOnboardingProModal(true);
      } else if (showProfileWelcomeModalOnLoad) {
        setShowProfileWelcomeModal(true);
      }
    } catch {
      // ignore
    }
  }, [
    isPublic,
    onboardingCompleteFromUrl,
    isFreeTier,
    showProfileWelcomeModalOnLoad,
  ]);

  useEffect(() => {
    if (isPublic || !showProfileWelcomeModalOnLoad || isFreeTier) return;
    setShowProfileWelcomeModal(true);
  }, [isPublic, isFreeTier, showProfileWelcomeModalOnLoad]);

  const handleEdit = () => {
    // Prevent editing in public mode
    if (isPublic) {
      return;
    }
    setEditMode('edit');
    // Update URL to reflect edit mode
    const url = new URL(window.location.href);
    url.searchParams.set('mode', 'edit');
    window.history.pushState({}, '', url.toString());
  };

  const markProfileWelcomeSeen = async () => {
    try {
      await fetch('/api/profile/mark-profile-welcome-seen', {
        method: 'POST',
      });
    } catch {
      // ignore: modal should still dismiss even if mark-as-seen fails.
    }
  };

  const handleDismissWelcomeModal = async () => {
    await markProfileWelcomeSeen();
    setShowProfileWelcomeModal(false);
  };

  const handleEditFromWelcomeModal = async () => {
    await markProfileWelcomeSeen();
    setShowProfileWelcomeModal(false);
    handleEdit();
  };

  // const handlePreview = () => {
  //   setEditMode('view');
  //   // Update URL to reflect view mode
  //   const url = new URL(window.location.href);
  //   url.searchParams.set('mode', 'view');
  //   window.history.pushState({}, '', url.toString());
  // };

  const handleSave = async (data: Record<string, unknown>) => {
    // Prevent saving in public mode
    if (isPublic) {
      return;
    }
    setIsLoading(true);

    try {
      // Merge saved data into state. Services are managed on the Services dashboard
      // route only, so always preserve existing services when updating from this form.
      setBusinessProfile(prev => ({
        ...prev,
        ...data,
        services: prev.services,
      }));

      // Check if this is a partial update (like cover photo upload)
      // If it's just cover photo or logo updates, don't switch to preview mode
      const isPartialUpdate =
        Object.keys(data).length <= 2 &&
        (data.cover_image_url ||
          data.banner_path ||
          data.logo_url ||
          data.logo_path);

      if (!isPartialUpdate) {
        // Switch to preview mode to show the updated profile (full save)
        setEditMode('view');
        // Update URL to reflect view mode
        const url = new URL(window.location.href);
        url.searchParams.set('mode', 'view');
        window.history.pushState({}, '', url.toString());
      }
    } catch {
      // Error updating business profile state
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancel = () => {
    setEditMode('view');
    // Update URL to reflect view mode
    const url = new URL(window.location.href);
    url.searchParams.set('mode', 'view');
    window.history.pushState({}, '', url.toString());
  };

  return (
    <div className="min-h-screen bg-[#0f0f0f]">
      {!isPublic ? (
        <>
          <ProfileWelcomeModal
            isOpen={editMode === 'view' && showProfileWelcomeModal}
            bookingLink={slugData?.fullLink}
            onEditProfile={handleEditFromWelcomeModal}
            onDismiss={handleDismissWelcomeModal}
          />
          <TryProPostOnboardingModal
            isOpen={showOnboardingProModal}
            onClose={opts => {
              setShowOnboardingProModal(false);
              if (opts?.continueToWelcome && showProfileWelcomeModalOnLoad) {
                queueMicrotask(() => setShowProfileWelcomeModal(true));
              }
            }}
          />
          <Modal
            isOpen={showProfileChecklistModal}
            onClose={() => setShowProfileChecklistModal(false)}
            title="Profile checklist"
            maxWidth="sm"
          >
            <div className="space-y-3">
              <p className="text-sm text-gray-300">
                Complete everything for better booking results.
              </p>
              {completionChecks.map(item => (
                <div
                  key={item.label}
                  className={`flex items-center gap-2.5 rounded-lg border px-2.5 py-2 text-xs sm:text-sm ${
                    item.done
                      ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-200'
                      : 'border-white/10 bg-white/[0.02] text-gray-400'
                  }`}
                >
                  <CheckCircleIcon
                    className={`h-4 w-4 shrink-0 ${
                      item.done ? 'text-emerald-300' : 'text-gray-600'
                    }`}
                  />
                  <span>{item.label}</span>
                </div>
              ))}
            </div>
          </Modal>
        </>
      ) : null}
      {/* Main Content */}
      <div
        className={`flex min-h-screen flex-col bg-[#0f0f0f] ${!isPublic && editMode === 'view' ? 'pb-24 sm:pb-24' : ''}`}
      >
        {editMode === 'view' && publicActiveSale ? (
          <PublicActiveSaleMarqueeBanner
            sale={publicActiveSale}
            bookingFlowLocale={bookingFlowLocale}
          />
        ) : null}
        <div className="mx-auto flex w-full max-w-4xl flex-1 flex-col [&>*]:shrink-0">
          {/* Create Link CTA - Only show for authenticated users without a slug */}
          {!isPublic && slugData && !slugData.hasSlug && (
            <div className="px-4 pt-4 pb-3 sm:pt-6 sm:pb-4 w-full min-w-0">
              <GlassCard
                padding="none"
                rounded="rounded-2xl"
                blurColor="bg-zinc-500"
                showBlur={true}
                className="text-left w-full min-w-0 p-4"
              >
                <div className="flex flex-wrap items-center gap-2 sm:gap-3 mb-2 min-w-0">
                  <h2 className="text-lg sm:text-xl font-bold text-white">
                    Your Link
                  </h2>
                  <RequiredLabel title="Add a link to share your profile" />
                </div>
                <div className="mt-3 mb-4 min-w-0">
                  <WarningCallout>
                    You need a link so customers can find and book you. Add one
                    in Settings.
                  </WarningCallout>
                </div>
                <Button
                  href={ROUTES.DASHBOARD.SETTINGS}
                  variant="inverse"
                  className="w-full sm:w-auto"
                  icon={<ArrowRightIcon className="h-4 w-4" />}
                  iconPosition="right"
                >
                  Go to Settings
                </Button>
              </GlassCard>
            </div>
          )}

          {editMode === 'view' ? (
            <>
              {profileCompletionTracker}
              <BusinessProfileReadView
                businessProfile={businessProfile}
                isPublic={isPublic}
                showVerifiedBadge={showVerifiedBadge}
                showRequestQuoteCta={showRequestQuoteCta}
                publicOwnerHasProForPriceOptions={
                  publicOwnerHasProForPriceOptions
                }
                publicFreeBookingsCapReached={publicFreeBookingsCapReached}
                bookingFlowLocale={bookingFlowLocale}
                publicReviewSummary={publicReviewSummary}
                publicProfileSlug={publicProfileSlug}
                publicActiveSale={publicActiveSale}
                publicSubscriptionPlans={publicSubscriptionPlans}
                initialTab={initialTab}
                coverageLabel={coverageLabel}
                showPublicFooter={isPublic}
                membershipCheckoutCanceled={membershipCheckoutCanceled}
              />
              {!isPublic ? (
                <div
                  className="fixed bottom-0 left-0 right-0 dashboard-sidebar-offset z-20 border-t border-white/10 bg-[var(--dashboard-bg)]/95 backdrop-blur-sm px-4 sm:px-8 py-4"
                  style={{
                    paddingBottom: 'max(1rem, env(safe-area-inset-bottom))',
                  }}
                >
                  <div className="max-w-2xl w-full mx-auto">
                    <Button
                      type="button"
                      onClick={handleEdit}
                      variant="inverse"
                      fullWidth
                      className="font-semibold"
                      icon={<PencilIcon className="h-4 w-4" />}
                    >
                      Edit profile
                    </Button>
                  </div>
                </div>
              ) : null}
            </>
          ) : (
            <div>
              {profileCompletionTracker}
              <EditBusinessProfile
                businessProfile={businessProfile}
                onSave={handleSave}
                onCancel={handleCancel}
                isLoading={isLoading}
                isFreeTier={isFreeTier}
                primaryServiceArea={primaryServiceArea}
                onPrimaryServiceAreaChange={setPrimaryServiceArea}
                initialTab={initialEditTab}
                focusShopAddress={focusShopAddress}
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
