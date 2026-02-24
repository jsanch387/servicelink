/**
 * Loading state for Book page (availability or request booking).
 * Skeleton reflects the availability booking flow: stepper, content area, sticky CTA.
 */

export default function BookPageLoading() {
  return (
    <div className="min-h-screen bg-[var(--dashboard-bg)]">
      {/* Header with Back Button Skeleton */}
      <div className="sticky top-0 z-10 bg-[var(--dashboard-bg)]/95 backdrop-blur-sm border-b border-white/10">
        <div className="max-w-2xl mx-auto px-4 sm:px-6 py-4">
          <div className="h-5 w-32 bg-neutral-800 rounded animate-pulse" />
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 sm:px-6 pt-6 pb-28">
        {/* Stepper skeleton */}
        <div className="flex items-center justify-center gap-4 py-4 border-b border-white/10">
          {[1, 2, 3].map(i => (
            <div key={i} className="flex items-center gap-2">
              <div className="h-9 w-9 rounded-full bg-neutral-800 animate-pulse" />
              {i < 3 && (
                <div className="h-px w-6 bg-neutral-800 rounded animate-pulse" />
              )}
            </div>
          ))}
        </div>

        {/* Content skeleton – step 1 style: title + calendar block + time grid */}
        <div className="space-y-6 pt-6">
          {/* Service / step title */}
          <div className="space-y-2">
            <div className="h-6 w-40 bg-neutral-800 rounded animate-pulse" />
            <div className="h-4 w-24 bg-neutral-800 rounded animate-pulse" />
          </div>

          {/* Calendar-style card */}
          <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-4 sm:p-6 animate-pulse">
            <div className="flex justify-between mb-4">
              <div className="h-6 w-28 bg-neutral-800 rounded" />
              <div className="flex gap-2">
                <div className="h-9 w-9 rounded-full bg-neutral-800" />
                <div className="h-9 w-9 rounded-full bg-neutral-800" />
              </div>
            </div>
            <div className="grid grid-cols-7 gap-1 mb-2">
              {Array.from({ length: 7 }).map((_, i) => (
                <div key={i} className="h-3 bg-neutral-800 rounded" />
              ))}
            </div>
            <div className="grid grid-cols-7 gap-2">
              {Array.from({ length: 35 }).map((_, i) => (
                <div
                  key={i}
                  className="aspect-square rounded-xl bg-neutral-800"
                />
              ))}
            </div>
          </div>

          {/* Time slots / section label */}
          <div className="space-y-3">
            <div className="h-6 w-28 bg-neutral-800 rounded animate-pulse" />
            <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
              {Array.from({ length: 8 }).map((_, i) => (
                <div
                  key={i}
                  className="h-12 rounded-xl bg-neutral-800 animate-pulse"
                />
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Sticky bottom CTA skeleton */}
      <div className="fixed bottom-0 left-0 right-0 z-20 border-t border-white/10 bg-[var(--dashboard-bg)]/95 p-4">
        <div className="max-w-2xl mx-auto">
          <div className="h-12 w-full rounded-xl bg-neutral-800 animate-pulse" />
        </div>
      </div>
    </div>
  );
}
