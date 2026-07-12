import type { ReactNode } from 'react';
import { Suspense } from 'react';
import { BookFlowLoadingState } from '@/features/availability/booking/components/BookFlowLoadingState';

/**
 * Shared shell for the public booking funnel (`/[slug]/book`, `/[slug]/book/details`, …).
 * Single Suspense boundary + loader for all nested book routes (avoids loading.tsx swaps).
 */
export default function BusinessBookRouteLayout({
  children,
}: {
  children: ReactNode;
}) {
  return (
    <div className="flex min-h-screen flex-col bg-[var(--dashboard-bg)]">
      <Suspense fallback={<BookFlowLoadingState />}>{children}</Suspense>
    </div>
  );
}
