'use client';

import { BookCalendarLoadingSkeleton } from '@/features/availability/booking/components/BookCalendarLoadingSkeleton';
import { BookServicePickerLoadingSkeleton } from '@/features/availability/booking/components/BookServicePickerLoadingSkeleton';
import { useSearchParams } from 'next/navigation';
import { Suspense } from 'react';

function BookPageLoadingContent() {
  const searchParams = useSearchParams();
  const serviceId = searchParams.get('serviceId')?.trim();

  if (serviceId) {
    return <BookCalendarLoadingSkeleton />;
  }

  return <BookServicePickerLoadingSkeleton />;
}

export default function BookPageLoading() {
  return (
    <Suspense fallback={<BookServicePickerLoadingSkeleton />}>
      <BookPageLoadingContent />
    </Suspense>
  );
}
