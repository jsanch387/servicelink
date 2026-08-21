'use client';

import { Button } from '@/components/shared';
import { MARKETING_IMAGES } from '@/constants/marketingImages';
import type { PublicBookingFlowLocale } from '@/constants/routes';
import { getPublicQuoteRequestPath } from '@/constants/routes';
import type { PublicActiveSale } from '@/features/marketing/types/publicActiveSale';
import type { PublicProfileReviewsSummary } from '@/features/reviews';
import {
  PublicSubscriptionsSection,
  type CustomerSubscriptionPlan,
} from '@/features/subscriptions';
import { publicBookingUi } from '@/libs/i18n/publicBookingUi';
import { PencilIcon } from '@heroicons/react/24/outline';
import { ChatBubbleLeftRightIcon } from '@heroicons/react/24/solid';
import Image from 'next/image';
import Link from 'next/link';
import React, { useEffect, useState } from 'react';
import { ProfileBioSection } from '../../components/ProfileBioSection';
import { WorkShowcase } from '../../components/WorkShowcase';
import { LazyPublicReviewsSection } from '../../reviews/components/LazyPublicReviewsSection';
import { CompleteBusinessProfile } from '../../types/businessProfile';
import { BookingLinkV2Header } from './BookingLinkV2Header';
import { BookingLinkV2ServicesSection } from './BookingLinkV2ServicesSection';
import { bookingLinkV2TabUnderlineClassName } from '../utils/bookingLinkV2Surface';

type ProfileTab = 'services' | 'subscriptions' | 'gallery' | 'bio' | 'reviews';

interface BookingLinkV2ViewProps {
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
  publicSubscriptionPlans?: CustomerSubscriptionPlan[];
  initialTab?: ProfileTab;
  onEdit?: () => void;
}

export function BookingLinkV2View({
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
  initialTab,
  onEdit,
}: BookingLinkV2ViewProps) {
  const bookingUi = publicBookingUi(bookingFlowLocale);
  const showReviewsTab = Boolean(
    publicReviewSummary &&
      publicReviewSummary.reviewCount > 0 &&
      publicProfileSlug
  );
  const showSubscriptionsTab = publicSubscriptionPlans.length > 0;

  const [activeTab, setActiveTab] = useState<ProfileTab>(() => {
    if (initialTab === 'subscriptions' && publicSubscriptionPlans.length > 0) {
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

  useEffect(() => {
    if (activeTab === 'reviews' && !showReviewsTab) {
      setActiveTab('services');
    }
    if (activeTab === 'subscriptions' && !showSubscriptionsTab) {
      setActiveTab('services');
    }
  }, [activeTab, showReviewsTab, showSubscriptionsTab]);

  const tabClass = (tab: ProfileTab) =>
    `relative shrink-0 cursor-pointer whitespace-nowrap pb-3 pt-0.5 text-sm font-medium transition-colors ${
      activeTab === tab ? 'text-white' : 'text-zinc-500 hover:text-zinc-400'
    }`;

  const quoteSlug = (
    publicProfileSlug ||
    businessProfile.business_slug ||
    ''
  ).trim();
  const showStickyQuote =
    isPublic && showRequestQuoteCta && Boolean(quoteSlug);

  return (
    <div className={!isPublic || showStickyQuote ? 'pb-24 sm:pb-24' : ''}>
      <BookingLinkV2Header
        businessProfile={businessProfile}
        isPublic={isPublic}
        showVerifiedBadge={showVerifiedBadge}
        bookingFlowLocale={bookingFlowLocale}
        publicReviewSummary={publicReviewSummary}
      />

      <div className="mt-8 px-4 sm:px-8">
        <div className="flex w-full gap-6 overflow-x-auto border-b border-white/10 scrollbar-none [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          <button
            type="button"
            onClick={() => setActiveTab('services')}
            className={tabClass('services')}
          >
            {bookingUi.profile.servicesTab}
            {activeTab === 'services' && (
              <span className={bookingLinkV2TabUnderlineClassName} />
            )}
          </button>
          {showSubscriptionsTab ? (
            <button
              type="button"
              onClick={() => setActiveTab('subscriptions')}
              className={tabClass('subscriptions')}
            >
              {bookingUi.subscriptions.subscriptionsTab}
              {activeTab === 'subscriptions' && (
                <span className={bookingLinkV2TabUnderlineClassName} />
              )}
            </button>
          ) : null}
          <button
            type="button"
            onClick={() => setActiveTab('gallery')}
            className={tabClass('gallery')}
          >
            {bookingUi.profile.galleryTab}
            {activeTab === 'gallery' && (
              <span className={bookingLinkV2TabUnderlineClassName} />
            )}
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('bio')}
            className={tabClass('bio')}
          >
            {bookingUi.profile.bioTab}
            {activeTab === 'bio' && (
              <span className={bookingLinkV2TabUnderlineClassName} />
            )}
          </button>
          {showReviewsTab ? (
            <button
              type="button"
              onClick={() => setActiveTab('reviews')}
              className={tabClass('reviews')}
            >
              {bookingUi.profile.reviewsTab}
              {activeTab === 'reviews' && (
                <span className={bookingLinkV2TabUnderlineClassName} />
              )}
            </button>
          ) : null}
        </div>
      </div>

      {activeTab === 'services' ? (
        <BookingLinkV2ServicesSection
          businessProfile={businessProfile}
          isPublic={isPublic}
          publicOwnerHasProForPriceOptions={publicOwnerHasProForPriceOptions}
          publicHideBookLinks={isPublic && publicFreeBookingsCapReached}
          bookingFlowLocale={bookingFlowLocale}
          publicActiveSale={publicActiveSale}
        />
      ) : activeTab === 'subscriptions' && showSubscriptionsTab ? (
        <PublicSubscriptionsSection
          plans={publicSubscriptionPlans}
          bookingFlowLocale={bookingFlowLocale}
          businessSlug={publicProfileSlug}
        />
      ) : activeTab === 'gallery' ? (
        <WorkShowcase
          businessProfile={businessProfile}
          editMode="view"
          onSave={async () => undefined}
          onCancel={() => undefined}
          isPublic={isPublic}
          bookingFlowLocale={bookingFlowLocale}
        />
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

      {showStickyQuote ? (
        <div
          className="fixed bottom-0 left-0 right-0 z-20 border-t border-white/10 bg-[var(--dashboard-bg)]/95 px-4 py-4 backdrop-blur-sm sm:px-8"
          style={{
            paddingBottom: 'max(1rem, env(safe-area-inset-bottom))',
          }}
        >
          <div className="mx-auto w-full max-w-4xl">
            <Button
              href={getPublicQuoteRequestPath(quoteSlug, {
                lang: bookingFlowLocale,
              })}
              variant="inverse"
              fullWidth
              className="font-semibold"
              icon={<ChatBubbleLeftRightIcon className="h-4 w-4" />}
            >
              {bookingUi.profile.requestQuote}
            </Button>
          </div>
        </div>
      ) : null}

      {!isPublic && onEdit ? (
        <div
          className="fixed bottom-0 left-0 right-0 z-20 border-t border-white/10 bg-[var(--dashboard-bg)]/95 px-4 py-4 backdrop-blur-sm sm:px-8 lg:left-64"
          style={{
            paddingBottom: 'max(1rem, env(safe-area-inset-bottom))',
          }}
        >
          <div className="mx-auto w-full max-w-2xl">
            <Button
              type="button"
              onClick={onEdit}
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

      {isPublic ? (
        <div className="mt-8 px-4 py-8 sm:px-8 sm:py-10">
          <div className="w-full border-t border-white/[0.06] pt-6">
            <div className="flex flex-col items-center gap-2 text-center">
              <Link
                href="/"
                className="group inline-flex items-center gap-2 text-gray-500 transition-colors hover:text-gray-300"
              >
                <span className="text-xs text-gray-500">Powered by</span>
                <Image
                  src={MARKETING_IMAGES.brand.favicon}
                  alt=""
                  width={14}
                  height={14}
                  className="opacity-70 transition-opacity group-hover:opacity-100"
                />
                <span className="text-sm font-medium text-gray-400 transition-colors group-hover:text-white">
                  ServiceLink
                </span>
              </Link>
              <p className="max-w-xs text-[11px] leading-relaxed text-gray-500">
                Get your own profile and start booking clients.
              </p>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
