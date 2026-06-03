'use client';

import { ROUTES } from '@/constants/routes';
import type { PublicBookingFlowLocale } from '@/constants/routes';
import { ArrowLeftIcon } from '@heroicons/react/24/outline';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import React, { useEffect } from 'react';
import { ReviewsDashboardShell } from './ReviewsDashboardShell';

interface ReviewDetailPageProps {
  reviewId: string;
  bookingFlowLocale?: PublicBookingFlowLocale;
}

/** Detail route placeholder until owner reviews API is wired. */
export const ReviewDetailPage: React.FC<ReviewDetailPageProps> = ({
  reviewId: _reviewId,
  bookingFlowLocale: _bookingFlowLocale = 'en',
}) => {
  const router = useRouter();

  useEffect(() => {
    router.replace(ROUTES.DASHBOARD.REVIEWS);
  }, [router]);

  return (
    <ReviewsDashboardShell variant="detail">
      <Link
        href={ROUTES.DASHBOARD.REVIEWS}
        className="mb-6 inline-flex items-center gap-2 text-sm font-medium text-zinc-400 transition-colors hover:text-white touch-manipulation"
      >
        <ArrowLeftIcon className="h-4 w-4" aria-hidden />
        All reviews
      </Link>
    </ReviewsDashboardShell>
  );
};
