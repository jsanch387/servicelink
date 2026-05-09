'use client';

import {
  PUBLIC_BOOKING_BOOKLOAD_QUERY,
  type PublicBookingBookLoadValue,
} from '@/constants/routes';
import { BookServiceDetailsLoadingSkeleton } from '@/features/services/booking-flow';
import { useSearchParams } from 'next/navigation';
import { Suspense } from 'react';
import { BookCalendarStepLoadingSkeleton } from './BookCalendarStepLoadingSkeleton';
import { BookPickerLoadingSkeleton } from './BookPickerLoadingSkeleton';

/** Before `useSearchParams` hydrates — generic, not profile and not step-specific. */
function BookLoadingSearchParamsFallback() {
  return (
    <div className="min-h-[55vh] bg-[var(--dashboard-bg)]">
      <div className="sticky top-0 z-10 bg-[var(--dashboard-bg)]/95 backdrop-blur-sm border-b border-white/10">
        <div className="max-w-2xl mx-auto px-4 sm:px-6 py-4">
          <div className="h-5 w-32 bg-neutral-800 rounded animate-pulse" />
        </div>
      </div>
      <div className="max-w-2xl mx-auto px-4 sm:px-6 pt-8 pb-24 space-y-5">
        <div className="h-8 w-56 max-w-full bg-neutral-800 rounded-lg animate-pulse" />
        <div className="h-28 w-full rounded-2xl bg-neutral-800/50 border border-white/[0.06] animate-pulse" />
        <div className="h-40 w-full rounded-2xl bg-neutral-800/40 border border-white/[0.06] animate-pulse" />
      </div>
    </div>
  );
}

function BookLoadingInner() {
  const searchParams = useSearchParams();
  const serviceId = searchParams.get('serviceId')?.trim();
  const raw = searchParams.get(PUBLIC_BOOKING_BOOKLOAD_QUERY);
  const bookLoad: PublicBookingBookLoadValue | null =
    raw === 'calendar' || raw === 'configure' ? raw : null;

  if (!serviceId) {
    return <BookPickerLoadingSkeleton />;
  }
  if (bookLoad === 'calendar') {
    return <BookCalendarStepLoadingSkeleton />;
  }
  return <BookServiceDetailsLoadingSkeleton />;
}

export function BookPageLoadingShell() {
  return (
    <Suspense fallback={<BookLoadingSearchParamsFallback />}>
      <BookLoadingInner />
    </Suspense>
  );
}
