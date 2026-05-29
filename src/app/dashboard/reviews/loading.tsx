import { ReviewsDashboardSkeleton } from '@/features/reviews';

export default function ReviewsLoading() {
  return (
    <main className="flex min-h-screen w-full flex-1 flex-col overflow-x-hidden bg-[var(--dashboard-bg)]">
      <div className="mx-auto w-full min-w-0 max-w-3xl flex-1 px-4 py-8 sm:px-6 sm:py-10 lg:px-8">
        <div className="mb-8 h-16 animate-pulse rounded-lg bg-white/[0.03]" />
        <ReviewsDashboardSkeleton />
      </div>
    </main>
  );
}
