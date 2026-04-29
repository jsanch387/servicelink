'use client';

import Image from 'next/image';
import Link from 'next/link';
import React, { useEffect, useState } from 'react';
import { CompleteBusinessProfile, EditMode } from '../types/businessProfile';
import { ProfileHeader } from './ProfileHeader';
import { ServicesList } from './ServicesList';
import { WorkShowcase } from './WorkShowcase';
// import { ReviewsSection } from './ReviewsSection'; // Will be used later
import {
  Button,
  GlassCard,
  Modal,
  RequiredLabel,
  WarningCallout,
} from '@/components/shared';
import { ROUTES } from '@/constants/routes';
import { TryProPostOnboardingModal } from '@/features/pricing';
import { ONBOARDING_PRO_MODAL_SEEN_KEY } from '@/features/pricing/types';
import { StoryPostShareButton } from '@/features/story-post';
import {
  ArrowRightIcon,
  CheckCircleIcon,
  PencilIcon,
} from '@heroicons/react/24/outline';
import { EditBusinessProfile } from './edit/EditBusinessProfile';
// import { BusinessProfileApi } from '../services/businessProfileApi'; // Will be used later

type TabType = 'services' | 'gallery' | 'bio';

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
  /** Pro + accept_quote_req: show Request quote on public / owner preview header. */
  showRequestQuoteCta?: boolean;
  /**
   * Public profile only: owner still has Pro — show “starting at” for services with price options.
   * When false, public services list hides multi-price presentation (data may still exist in DB).
   */
  publicOwnerHasProForPriceOptions?: boolean;
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
}) => {
  const [editMode, setEditMode] = useState<EditMode>(initialMode);
  const [businessProfile, setBusinessProfile] =
    useState<CompleteBusinessProfile>(initialBusinessProfile);
  const [isLoading, setIsLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<TabType>('services');
  const [showOnboardingProModal, setShowOnboardingProModal] = useState(false);
  const [showProfileWelcomeModal, setShowProfileWelcomeModal] = useState(false);
  const [showProfileChecklistModal, setShowProfileChecklistModal] =
    useState(false);
  const { city, state } = parseCityState(businessProfile.service_area);
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
    { label: 'City + state', done: Boolean(city && state) },
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
  const completedChecks = completionChecks.filter(item => item.done).length;
  const profileCompletionPercent = Math.round(
    (completedChecks / completionChecks.length) * 100
  );
  const completionTone =
    profileCompletionPercent >= 100
      ? {
          barClass: 'from-emerald-400 to-green-500',
          textClass: 'text-emerald-300',
        }
      : profileCompletionPercent >= 75
        ? {
            barClass: 'from-cyan-300 to-sky-400',
            textClass: 'text-cyan-200',
          }
        : profileCompletionPercent >= 40
          ? {
              barClass: 'from-amber-300 to-yellow-400',
              textClass: 'text-amber-200',
            }
          : {
              barClass: 'from-red-500 to-red-600',
              textClass: 'text-red-300',
            };
  const profileCompletionTracker = !isPublic ? (
    <div className="px-4 pt-4 pb-2 sm:px-8 sm:pt-6">
      <div className="flex items-center justify-between gap-3">
        <h2 className="text-sm sm:text-base font-medium text-gray-200">
          Profile completion
        </h2>
        <span
          className={`shrink-0 text-xs sm:text-sm font-medium tabular-nums ${completionTone.textClass}`}
        >
          {profileCompletionPercent}%
        </span>
      </div>

      <div className="mt-2 h-2 rounded-full bg-white/10 ring-1 ring-white/10 overflow-hidden">
        <div
          className={`relative h-full rounded-full bg-gradient-to-r transition-all duration-500 ${completionTone.barClass}`}
          style={{
            width: `${profileCompletionPercent}%`,
          }}
        >
          <span
            className="pointer-events-none absolute inset-0 opacity-40"
            style={{
              background:
                'linear-gradient(180deg, rgba(255,255,255,0.42), rgba(255,255,255,0))',
            }}
          />
        </div>
      </div>

      <button
        type="button"
        onClick={() => setShowProfileChecklistModal(true)}
        className="mt-2 text-xs sm:text-sm text-gray-400 hover:text-white transition-colors cursor-pointer"
      >
        View checklist
      </button>
    </div>
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

  // One-time Try Pro modal when user lands from onboarding complete (free tier only)
  useEffect(() => {
    if (isPublic || !onboardingCompleteFromUrl || !isFreeTier) return;
    try {
      if (!window.localStorage.getItem(ONBOARDING_PRO_MODAL_SEEN_KEY)) {
        setShowOnboardingProModal(true);
      }
    } catch {
      // ignore
    }
  }, [isPublic, onboardingCompleteFromUrl, isFreeTier]);

  useEffect(() => {
    if (isPublic || isFreeTier) return;
    setShowProfileWelcomeModal(showProfileWelcomeModalOnLoad);
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

  const handleEditFromWelcomeModal = async () => {
    try {
      await fetch('/api/profile/mark-profile-welcome-seen', {
        method: 'POST',
      });
    } catch {
      // ignore: editing should still proceed even if mark-as-seen fails.
    }
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
      <Modal
        isOpen={
          !isPublic &&
          !isFreeTier &&
          editMode === 'view' &&
          showProfileWelcomeModal
        }
        onClose={() => {
          // Intentionally no-op: this modal closes after "Edit profile".
        }}
        title=""
        maxWidth="sm"
      >
        <div className="flex flex-col gap-5">
          <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4 sm:p-5">
            <h2 className="flex items-center gap-3 text-xl font-semibold tracking-tight text-white sm:text-2xl">
              <span className="relative flex h-3.5 w-3.5 shrink-0" aria-hidden>
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400/70" />
                <span className="relative inline-flex h-3.5 w-3.5 rounded-full bg-emerald-500 ring-2 ring-emerald-500/30" />
              </span>
              Your booking link is live
            </h2>
            <p className="mt-2 text-sm leading-relaxed text-gray-300">
              This is the page customers see when they visit your link. Add your
              logo and cover photo, then update your info to look more
              professional and book with confidence.
            </p>
          </div>

          <div className="rounded-xl border border-white/10 bg-white/[0.03] p-3 text-xs text-gray-300">
            Pro tip: a complete profile helps you convert more visitors into
            bookings.
          </div>

          <div className="flex">
            <Button
              type="button"
              onClick={handleEditFromWelcomeModal}
              variant="inverse"
              className="w-full sm:w-auto sm:min-w-[12rem]"
              icon={<PencilIcon className="h-4 w-4" />}
              iconPosition="left"
            >
              Edit profile
            </Button>
          </div>
        </div>
      </Modal>
      <TryProPostOnboardingModal
        isOpen={showOnboardingProModal}
        onClose={() => setShowOnboardingProModal(false)}
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
      {/* Main Content */}
      <div
        className={`bg-[#0f0f0f] min-h-screen ${!isPublic && editMode === 'view' ? 'pb-24 sm:pb-24' : ''}`}
      >
        <div className="max-w-4xl mx-auto">
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

          {/* Action bar above profile header (icon-only actions, e.g. share) */}
          {!isPublic &&
            slugData &&
            slugData.hasSlug &&
            slugData.fullLink &&
            businessProfile.logo_url && (
              <div className="px-2 sm:px-4 py-2 flex justify-end">
                <div className="inline-flex items-center gap-2">
                  <StoryPostShareButton
                    businessName={businessProfile.business_name}
                    logoUrl={businessProfile.logo_url}
                    bookingUrl={slugData.fullLink}
                  />
                  {/* Future action icons can be added here */}
                </div>
              </div>
            )}

          {editMode === 'view' ? (
            // Preview Mode - Show customer view
            <>
              {profileCompletionTracker}
              <ProfileHeader
                businessProfile={businessProfile}
                editMode={editMode}
                onSave={handleSave}
                onCancel={handleCancel}
                isPublic={isPublic}
                showVerifiedBadge={showVerifiedBadge}
                showRequestQuoteCta={showRequestQuoteCta}
              />

              {/* Tabs Navigation */}
              <div className="px-4 sm:px-8 mt-8 border-b border-white/[0.06]">
                <div className="flex gap-6">
                  <button
                    onClick={() => setActiveTab('services')}
                    className={`pb-3 pt-0.5 text-sm font-medium transition-colors relative cursor-pointer ${
                      activeTab === 'services'
                        ? 'text-white'
                        : 'text-zinc-500 hover:text-zinc-400'
                    }`}
                  >
                    Services
                    {activeTab === 'services' && (
                      <span className="absolute bottom-0 left-0 right-0 h-px bg-white/70" />
                    )}
                  </button>
                  <button
                    onClick={() => setActiveTab('gallery')}
                    className={`pb-3 pt-0.5 text-sm font-medium transition-colors relative cursor-pointer ${
                      activeTab === 'gallery'
                        ? 'text-white'
                        : 'text-zinc-500 hover:text-zinc-400'
                    }`}
                  >
                    Gallery
                    {activeTab === 'gallery' && (
                      <span className="absolute bottom-0 left-0 right-0 h-px bg-white/70" />
                    )}
                  </button>
                  <button
                    onClick={() => setActiveTab('bio')}
                    className={`pb-3 pt-0.5 text-sm font-medium transition-colors relative cursor-pointer ${
                      activeTab === 'bio'
                        ? 'text-white'
                        : 'text-zinc-500 hover:text-zinc-400'
                    }`}
                  >
                    Bio
                    {activeTab === 'bio' && (
                      <span className="absolute bottom-0 left-0 right-0 h-px bg-white/70" />
                    )}
                  </button>
                </div>
              </div>

              {/* Tab Content */}
              {activeTab === 'services' ? (
                <ServicesList
                  businessProfile={businessProfile}
                  editMode={editMode}
                  onSave={handleSave}
                  onCancel={handleCancel}
                  isPublic={isPublic}
                  publicOwnerHasProForPriceOptions={
                    publicOwnerHasProForPriceOptions
                  }
                />
              ) : activeTab === 'gallery' ? (
                <WorkShowcase
                  businessProfile={businessProfile}
                  editMode={editMode}
                  onSave={handleSave}
                  onCancel={handleCancel}
                />
              ) : (
                <section className="px-4 py-6 sm:px-8 sm:py-8">
                  {(businessProfile.bio?.trim() ?? '') ? (
                    <p className="whitespace-pre-wrap text-sm leading-relaxed text-gray-400 sm:text-[15px]">
                      {businessProfile.bio}
                    </p>
                  ) : (
                    <p className="text-sm text-zinc-500">No bio added yet.</p>
                  )}
                </section>
              )}

              {/* Sticky Edit Profile button - view mode, authenticated users only */}
              {!isPublic && editMode === 'view' && (
                <div
                  className="fixed bottom-0 left-0 right-0 lg:left-64 z-20 border-t border-white/10 bg-[var(--dashboard-bg)]/95 backdrop-blur-sm px-4 sm:px-8 py-4"
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
              )}

              {/* Footer - Only show on public profiles */}
              {isPublic && (
                <div className="px-4 sm:px-8 py-8 sm:py-10 mt-8">
                  <div className="w-full border-t border-white/[0.06] pt-6">
                    <div className="flex flex-col items-center gap-2 text-center">
                      <Link
                        href="/"
                        className="group inline-flex items-center gap-2 text-gray-500 hover:text-gray-300 transition-colors"
                      >
                        <span className="text-[11px] uppercase tracking-wider">
                          Powered by
                        </span>
                        <Image
                          src="/favicon.png"
                          alt=""
                          width={14}
                          height={14}
                          className="opacity-70 group-hover:opacity-100 transition-opacity"
                        />
                        <span className="text-gray-400 text-sm font-medium group-hover:text-white transition-colors">
                          ServiceLink
                        </span>
                      </Link>
                      <p className="text-gray-500 text-[11px] max-w-xs leading-relaxed">
                        Get your own profile and start booking clients.
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </>
          ) : (
            // Edit Mode - Show unified edit form
            <div>
              {profileCompletionTracker}
              <EditBusinessProfile
                businessProfile={businessProfile}
                onSave={handleSave}
                onCancel={handleCancel}
                isLoading={isLoading}
                isFreeTier={isFreeTier}
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
