'use client';

import { ROUTES } from '@/constants/routes';
import type { PublicBookingFlowLocale } from '@/constants/routes';
import { bcp47ForBookingLocale } from '@/libs/i18n/publicBookingUi';
import { ArrowLeftIcon } from '@heroicons/react/24/outline';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import React, { useCallback, useEffect, useState } from 'react';
import { MOCK_DASHBOARD_REVIEWS } from '../constants/mockDashboardReviews';
import type { DashboardReview } from '../types';
import { reviewNeedsReply } from '../utils/reviewFilters';
import { ReviewListRow } from './list/ReviewListRow';
import { ReviewsDashboardShell } from './ReviewsDashboardShell';

interface ReviewDetailPageProps {
  reviewId: string;
  bookingFlowLocale?: PublicBookingFlowLocale;
}

export const ReviewDetailPage: React.FC<ReviewDetailPageProps> = ({
  reviewId,
  bookingFlowLocale = 'en',
}) => {
  const router = useRouter();
  const locale = bcp47ForBookingLocale(bookingFlowLocale);
  const initial = MOCK_DASHBOARD_REVIEWS.find(r => r.id === reviewId);
  const [review, setReview] = useState<DashboardReview | undefined>(initial);
  const [openReply, setOpenReply] = useState(
    () => initial !== undefined && reviewNeedsReply(initial)
  );

  useEffect(() => {
    if (!initial) {
      router.replace(ROUTES.DASHBOARD.REVIEWS);
    }
  }, [initial, router]);

  const handleSendReply = useCallback((id: string, body: string) => {
    setReview(prev =>
      prev && prev.id === id
        ? { ...prev, ownerReply: { body, repliedAt: new Date().toISOString() } }
        : prev
    );
    setOpenReply(false);
  }, []);

  if (!review) {
    return null;
  }

  return (
    <ReviewsDashboardShell variant="detail">
      <Link
        href={ROUTES.DASHBOARD.REVIEWS}
        className="mb-6 inline-flex items-center gap-2 text-sm font-medium text-zinc-400 transition-colors hover:text-white touch-manipulation"
      >
        <ArrowLeftIcon className="h-4 w-4" aria-hidden />
        All reviews
      </Link>

      <ReviewListRow
        review={review}
        locale={locale}
        isReplyOpen={openReply}
        onToggleReply={() => setOpenReply(v => !v)}
        onSendReply={handleSendReply}
      />
    </ReviewsDashboardShell>
  );
};
