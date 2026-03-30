/**
 * Loading UI for /[slug]/book/details — mirrors service header, price options, summary, sticky CTA.
 * Skeleton styling aligned with public profile service cards (BusinessProfileLoadingState):
 * neutral-800 cards, border-neutral-700/50, inner neutral-700 bars, animate-pulse.
 */

export function BookServiceDetailsLoadingSkeleton() {
  return (
    <div className="min-h-screen bg-[var(--dashboard-bg)]">
      <div className="sticky top-0 z-10 bg-[var(--dashboard-bg)]/95 backdrop-blur-sm border-b border-white/10">
        <div className="max-w-2xl mx-auto px-4 sm:px-6 py-4">
          <div className="h-5 w-36 bg-neutral-800 rounded animate-pulse" />
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 sm:px-6 pt-6 pb-32">
        {/* Service header — same line weights as profile text skeleton */}
        <section className="mb-6 space-y-3">
          <div className="h-7 max-w-md bg-neutral-700 rounded-lg animate-pulse" />
          <div className="h-4 w-48 bg-neutral-700 rounded animate-pulse" />
          <div className="space-y-2 pt-1">
            <div className="h-4 w-full bg-neutral-700 rounded animate-pulse max-w-full" />
            <div className="h-4 w-[92%] bg-neutral-700 rounded animate-pulse" />
            <div className="h-4 w-[70%] bg-neutral-700 rounded animate-pulse" />
          </div>
        </section>

        {/* Price options — same card pattern as profile “Services” skeleton */}
        <section className="mb-6">
          <div className="h-5 w-40 bg-neutral-700 rounded mb-3 animate-pulse" />
          <div className="grid grid-cols-1 gap-3" aria-hidden>
            {[1, 2, 3].map(i => (
              <div
                key={i}
                className="bg-neutral-800 rounded-2xl border border-neutral-700/50 p-5 animate-pulse"
              >
                <div className="flex justify-between items-start gap-3 mb-2">
                  <div className="flex-1 min-w-0 space-y-2">
                    <div className="h-5 bg-neutral-700 rounded w-36 max-w-[55%]" />
                    <div className="h-3 bg-neutral-700 rounded w-28" />
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <div className="h-4 w-14 bg-neutral-700 rounded" />
                    <div className="h-6 w-6 rounded-full bg-neutral-700" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Summary card — profile-style card */}
        <section className="mb-8 bg-neutral-800 rounded-2xl border border-neutral-700/50 p-5 animate-pulse space-y-4">
          <div className="h-3 w-16 bg-neutral-700 rounded" />
          <div className="flex justify-between gap-3">
            <div className="h-4 flex-1 max-w-[200px] bg-neutral-700 rounded" />
            <div className="h-4 w-16 bg-neutral-700 rounded shrink-0" />
          </div>
          <div className="h-px bg-neutral-700/60" />
          <div className="flex justify-between gap-3 pt-1">
            <div className="h-4 w-20 bg-neutral-700 rounded" />
            <div className="h-5 w-20 bg-neutral-700 rounded" />
          </div>
        </section>
      </div>

      <div
        className="fixed bottom-0 left-0 right-0 z-20 border-t border-white/10 bg-[var(--dashboard-bg)]/95 backdrop-blur-sm p-4"
        style={{ paddingBottom: 'max(1rem, env(safe-area-inset-bottom))' }}
      >
        <div className="max-w-2xl mx-auto">
          <div className="h-12 w-full rounded-xl bg-neutral-700 animate-pulse" />
        </div>
      </div>
    </div>
  );
}
