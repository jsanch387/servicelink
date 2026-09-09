'use client';

import { MARKETING_IMAGES } from '@/constants/marketingImages';
import type { PublicBookingFlowLocale } from '@/constants/routes';
import type { PublicProfileReviewsSummary } from '@/features/reviews';
import type { PublicActiveSale } from '@/features/marketing/types/publicActiveSale';
import type { CustomerSubscriptionPlan } from '@/features/subscriptions/types/customerSubscriptionPlan';
import { toast } from '@/components/shared';
import { publicBookingUi } from '@/libs/i18n/publicBookingUi';
import { LazyPublicSubscriptionsSection } from '@/features/subscriptions/components/LazyPublicSubscriptionsSection';
import { PublicSubscriptionsSection } from '@/features/subscriptions/components/PublicSubscriptionsSection';
import { InformationCircleIcon } from '@heroicons/react/24/outline';
import Image from 'next/image';
import Link from 'next/link';
import React, { Suspense, useEffect, useRef, useState } from 'react';
import { CompleteBusinessProfile } from '../types/businessProfile';
import { LazyPublicReviewsSection } from '../reviews/components/LazyPublicReviewsSection';
import { LazyPublicGallerySection } from './LazyPublicGallerySection';
import { ProfileBioSection } from './ProfileBioSection';
import { ProfileHeader } from './ProfileHeader';
import { PublicProfileTabPanelSkeleton } from './PublicProfileTabPanelSkeleton';
import { ServicesList } from './ServicesList';
import { WorkShowcase } from './WorkShowcase';

type TabType = 'services' | 'subscriptions' | 'gallery' | 'bio' | 'reviews';

const noopSave = async () => {};
const noopCancel = () => {};

export interface BusinessProfileReadViewProps {
  businessProfile: CompleteBusinessProfile;
  isPublic?: boolean;
  showVerifiedBadge?: boolean;
  showRequestQuoteCta?: boolean;
  publicOwnerHasProForPriceOptions?: boolean;
  publicFreeBookingsCapReached?: boolean;
  bookingFlowLocale?: PublicBookingFlowLocale;
  publicReviewSummary?: PublicProfileReviewsSummary | null;
  publicProfileSlug?: string;
  publicActiveSale?: PublicActiveSale | null;
  /** Eager plans (dashboard preview). Public landing uses the flag + lazy fetch. */
  publicSubscriptionPlans?: CustomerSubscriptionPlan[];
  /** Show Subscriptions tab without loading plan bodies on first paint. */
  hasPublicSubscriptionPlans?: boolean;
  initialTab?: TabType;
  coverageLabel?: string | null;
  showPublicFooter?: boolean;
  membershipCheckoutCanceled?: boolean;
}

export const BusinessProfileReadView: React.FC<
  BusinessProfileReadViewProps
> = ({
  businessProfile,
  isPublic = false,
  showVerifiedBadge = false,
  showRequestQuoteCta = false,
  publicOwnerHasProForPriceOptions = false,
  publicFreeBookingsCapReached = false,
  bookingFlowLocale = 'en',
  publicReviewSummary = null,
  publicProfileSlug,
  publicActiveSale = null,
  publicSubscriptionPlans = [],
  hasPublicSubscriptionPlans = false,
  initialTab,
  coverageLabel = null,
  showPublicFooter = false,
  membershipCheckoutCanceled = false,
}) => {
  const showReviewsTab = Boolean(
    publicReviewSummary &&
      publicReviewSummary.reviewCount > 0 &&
      publicProfileSlug
  );
  const showSubscriptionsTab =
    publicSubscriptionPlans.length > 0 ||
    Boolean(hasPublicSubscriptionPlans && publicProfileSlug);
  const deferSubscriptions =
    isPublic &&
    Boolean(publicProfileSlug) &&
    publicSubscriptionPlans.length === 0;
  const deferGallery = isPublic && Boolean(publicProfileSlug);
  const [activeTab, setActiveTab] = useState<TabType>(() => {
    if (initialTab === 'subscriptions' && showSubscriptionsTab) {
      return 'subscriptions';
    }
    if (initialTab === 'reviews' && publicReviewSummary?.reviewCount) {
      return 'reviews';
    }
    if (
      initialTab === 'gallery' ||
      initialTab === 'bio' ||
      initialTab === 'services'
    ) {
      return initialTab;
    }
    return 'services';
  });
  const bookingUi = publicBookingUi(bookingFlowLocale);
  const handledMembershipCheckoutCancel = useRef(false);

  const clearMembershipCheckoutParams = () => {
    if (typeof window === 'undefined') return;
    const params = new URLSearchParams(window.location.search);
    params.delete('membershipCheckout');
    params.delete('session_id');
    params.delete('planId');
    params.delete('priceId');
    const next = params.toString();
    const path = `${window.location.pathname}${next ? `?${next}` : ''}${window.location.hash}`;
    window.history.replaceState({}, '', path);
  };

  useEffect(() => {
    if (activeTab === 'reviews' && !showReviewsTab) {
      setActiveTab('services');
    }
    if (activeTab === 'subscriptions' && !showSubscriptionsTab) {
      setActiveTab('services');
    }
  }, [activeTab, showReviewsTab, showSubscriptionsTab]);

  useEffect(() => {
    if (
      !membershipCheckoutCanceled ||
      handledMembershipCheckoutCancel.current
    ) {
      return;
    }
    handledMembershipCheckoutCancel.current = true;
    if (showSubscriptionsTab) setActiveTab('subscriptions');
    toast.warning(bookingUi.subscriptions.checkoutReturnCancel);
    clearMembershipCheckoutParams();
  }, [
    membershipCheckoutCanceled,
    bookingUi.subscriptions,
    showSubscriptionsTab,
  ]);

  return (
    <>
      <ProfileHeader
        businessProfile={businessProfile}
        editMode="view"
        onSave={noopSave}
        onCancel={noopCancel}
        isPublic={isPublic}
        showVerifiedBadge={showVerifiedBadge}
        showRequestQuoteCta={showRequestQuoteCta}
        bookingFlowLocale={bookingFlowLocale}
        publicReviewSummary={publicReviewSummary}
        coverageLabel={coverageLabel}
      />

      <div className="mt-8 px-4 sm:px-8 border-b border-white/[0.06]">
        <div className="flex gap-6 overflow-x-auto scrollbar-none [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          <button
            onClick={() => setActiveTab('services')}
            className={`pb-3 pt-0.5 text-sm font-medium transition-colors relative cursor-pointer ${
              activeTab === 'services'
                ? 'text-white'
                : 'text-zinc-500 hover:text-zinc-400'
            }`}
          >
            {bookingUi.profile.servicesTab}
            {activeTab === 'services' && (
              <span className="absolute bottom-0 left-0 right-0 h-px bg-white/70" />
            )}
          </button>
          {showSubscriptionsTab ? (
            <button
              onClick={() => setActiveTab('subscriptions')}
              className={`pb-3 pt-0.5 text-sm font-medium transition-colors relative cursor-pointer whitespace-nowrap ${
                activeTab === 'subscriptions'
                  ? 'text-white'
                  : 'text-zinc-500 hover:text-zinc-400'
              }`}
            >
              {bookingUi.subscriptions.subscriptionsTab}
              {activeTab === 'subscriptions' && (
                <span className="absolute bottom-0 left-0 right-0 h-px bg-white/70" />
              )}
            </button>
          ) : null}
          <button
            onClick={() => setActiveTab('gallery')}
            className={`pb-3 pt-0.5 text-sm font-medium transition-colors relative cursor-pointer ${
              activeTab === 'gallery'
                ? 'text-white'
                : 'text-zinc-500 hover:text-zinc-400'
            }`}
          >
            {bookingUi.profile.galleryTab}
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
            {bookingUi.profile.bioTab}
            {activeTab === 'bio' && (
              <span className="absolute bottom-0 left-0 right-0 h-px bg-white/70" />
            )}
          </button>
          {showReviewsTab ? (
            <button
              onClick={() => setActiveTab('reviews')}
              className={`pb-3 pt-0.5 text-sm font-medium transition-colors relative cursor-pointer ${
                activeTab === 'reviews'
                  ? 'text-white'
                  : 'text-zinc-500 hover:text-zinc-400'
              }`}
            >
              {bookingUi.profile.reviewsTab}
              {activeTab === 'reviews' && (
                <span className="absolute bottom-0 left-0 right-0 h-px bg-white/70" />
              )}
            </button>
          ) : null}
        </div>
      </div>

      <Suspense
        fallback={
          <PublicProfileTabPanelSkeleton
            variant={activeTab === 'gallery' ? 'gallery' : 'generic'}
          />
        }
      >
        {activeTab === 'services' ? (
          <>
            {isPublic && publicFreeBookingsCapReached ? (
              <div
                className="px-4 sm:px-8 mt-5 mb-1 flex items-center gap-2 text-sm text-zinc-500"
                role="status"
              >
                <InformationCircleIcon
                  className="h-4 w-4 shrink-0 text-zinc-500/80"
                  aria-hidden
                />
                <span className="leading-snug">
                  {bookingUi.profile.notTakingBookingsRightNow}
                </span>
              </div>
            ) : null}
            <ServicesList
              businessProfile={businessProfile}
              editMode="view"
              onSave={noopSave}
              onCancel={noopCancel}
              isPublic={isPublic}
              publicOwnerHasProForPriceOptions={
                publicOwnerHasProForPriceOptions
              }
              publicHideBookLinks={isPublic && publicFreeBookingsCapReached}
              compactTopPadding={isPublic && publicFreeBookingsCapReached}
              bookingFlowLocale={bookingFlowLocale}
              publicActiveSale={publicActiveSale}
            />
          </>
        ) : activeTab === 'subscriptions' && showSubscriptionsTab ? (
          deferSubscriptions && publicProfileSlug ? (
            <LazyPublicSubscriptionsSection
              businessSlug={publicProfileSlug}
              bookingFlowLocale={bookingFlowLocale}
              isActive
            />
          ) : (
            <PublicSubscriptionsSection
              plans={publicSubscriptionPlans}
              bookingFlowLocale={bookingFlowLocale}
              businessSlug={publicProfileSlug}
            />
          )
        ) : activeTab === 'gallery' ? (
          deferGallery && publicProfileSlug ? (
            <LazyPublicGallerySection
              businessSlug={publicProfileSlug}
              businessProfile={businessProfile}
              bookingFlowLocale={bookingFlowLocale}
              isActive
            />
          ) : (
            <WorkShowcase
              businessProfile={businessProfile}
              editMode="view"
              onSave={noopSave}
              onCancel={noopCancel}
              isPublic={isPublic}
              bookingFlowLocale={bookingFlowLocale}
            />
          )
        ) : activeTab === 'bio' ? (
          <section className="px-4 py-6 sm:px-8 sm:py-8">
            <ProfileBioSection
              businessProfile={businessProfile}
              bookingFlowLocale={bookingFlowLocale}
            />
          </section>
        ) : showReviewsTab && publicReviewSummary && publicProfileSlug ? (
          <LazyPublicReviewsSection
            businessSlug={publicProfileSlug}
            summary={publicReviewSummary}
            bookingFlowLocale={bookingFlowLocale}
            isActive={activeTab === 'reviews'}
          />
        ) : null}
      </Suspense>

      {showPublicFooter ? (
        <div
          className="mt-auto px-4 pt-10 sm:px-8 sm:pt-12"
          style={{
            paddingBottom:
              'max(2rem, calc(2rem + env(safe-area-inset-bottom)))',
          }}
        >
          <div className="w-full border-t border-white/[0.06] pt-6">
            <div className="flex flex-col items-center gap-2 text-center">
              <Link
                href="/"
                className="group inline-flex items-center gap-2 text-gray-500 hover:text-gray-300 transition-colors"
              >
                <span className="text-xs text-gray-500">Powered by</span>
                <Image
                  src={MARKETING_IMAGES.brand.favicon}
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
      ) : null}
    </>
  );
};
