'use client';

import type { PublicBookingFlowLocale } from '@/constants/routes';
import type {
  PublicProfileReviewsData,
  PublicProfileReviewsSummary,
} from '@/features/reviews';
import { getPublicProfileReviewsApiPath } from '@/features/reviews/utils/getPublicProfileReviewsApiPath';
import { publicBookingUi } from '@/libs/i18n/publicBookingUi';
import React, { useCallback, useEffect, useState } from 'react';
import { ReviewsSectionLoading } from './ReviewsSectionLoading';
import { ProfileReviewsList } from './list/ProfileReviewsList';
import { ProfileReviewsSummary } from './summary/ProfileReviewsSummary';

type LoadState = 'idle' | 'loading' | 'ready' | 'error';

interface LazyPublicReviewsSectionProps {
  businessSlug: string;
  summary: PublicProfileReviewsSummary;
  bookingFlowLocale?: PublicBookingFlowLocale;
  /** Fetch when the Reviews tab is active. */
  isActive: boolean;
}

export const LazyPublicReviewsSection: React.FC<
  LazyPublicReviewsSectionProps
> = ({ businessSlug, summary, bookingFlowLocale = 'en', isActive }) => {
  const ui = publicBookingUi(bookingFlowLocale);
  const [data, setData] = useState<PublicProfileReviewsData | null>(null);
  const [loadState, setLoadState] = useState<LoadState>('idle');

  const fetchReviews = useCallback(async () => {
    setLoadState('loading');
    try {
      const res = await fetch(getPublicProfileReviewsApiPath(businessSlug), {
        method: 'GET',
        headers: { Accept: 'application/json' },
      });
      const json = (await res.json()) as {
        success?: boolean;
        data?: PublicProfileReviewsData;
        error?: string;
      };

      if (!res.ok || !json.success || !json.data) {
        setLoadState('error');
        return;
      }

      setData(json.data);
      setLoadState('ready');
    } catch {
      setLoadState('error');
    }
  }, [businessSlug]);

  useEffect(() => {
    if (!isActive) return;
    if (data || loadState === 'loading') return;
    if (loadState === 'ready' || loadState === 'error') return;
    void fetchReviews();
  }, [isActive, data, loadState, fetchReviews]);

  const displaySummary = data?.summary ?? summary;

  return (
    <section
      className="px-4 pt-6 pb-6 sm:px-8 sm:pt-8 sm:pb-8"
      aria-label={ui.profile.reviewsSectionTitle}
    >
      <ProfileReviewsSummary
        bookingFlowLocale={bookingFlowLocale}
        summary={displaySummary}
      />

      {loadState === 'loading' || loadState === 'idle' ? (
        <ReviewsSectionLoading ariaLabel={ui.profile.reviewsLoadingAriaLabel} />
      ) : null}

      {loadState === 'error' ? (
        <div className="-mx-4 border-t border-white/[0.06] px-4 py-8 text-center sm:-mx-8 sm:px-8">
          <p className="text-sm text-zinc-500">{ui.profile.reviewsLoadError}</p>
          <button
            type="button"
            onClick={() => {
              setLoadState('idle');
              void fetchReviews();
            }}
            className="mt-3 text-sm font-medium text-white/80 underline-offset-2 hover:text-white hover:underline touch-manipulation"
          >
            {ui.profile.reviewsRetry}
          </button>
        </div>
      ) : null}

      {loadState === 'ready' && data ? (
        <ProfileReviewsList
          reviews={data.reviews}
          bookingFlowLocale={bookingFlowLocale}
        />
      ) : null}
    </section>
  );
};
