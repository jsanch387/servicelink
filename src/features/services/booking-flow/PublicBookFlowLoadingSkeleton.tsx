/**
 * Shared loading UI for public booking routes (`/book`, `/book/details`).
 * Matches the calendar step layout so navigation between picker → details → calendar
 * does not flash unrelated placeholders (e.g. fake price-option cards).
 */

export function PublicBookFlowLoadingSkeleton() {
  return (
    <div className="min-h-screen bg-[var(--dashboard-bg)]">
      <div className="sticky top-0 z-10 bg-[var(--dashboard-bg)]/95 backdrop-blur-sm border-b border-white/10">
        <div className="max-w-2xl mx-auto px-4 sm:px-6 py-4">
          <div className="h-5 w-32 bg-neutral-800 rounded animate-pulse" />
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 sm:px-6 pt-6 pb-28">
        <div className="space-y-6 pt-4">
          <section>
            <div className="flex justify-between gap-4 items-start">
              <div className="min-w-0 flex-1 space-y-2">
                <div className="h-6 w-48 max-w-full bg-neutral-800 rounded animate-pulse" />
                <div className="h-4 w-36 bg-neutral-800 rounded animate-pulse" />
              </div>
              <div className="h-5 w-16 bg-neutral-800 rounded animate-pulse shrink-0 mt-0.5" />
            </div>
          </section>

          <div className="w-full sm:max-w-[360px] rounded-2xl border border-white/10 bg-white/[0.02] p-4 sm:p-6 shadow-xl">
            <div className="flex items-center justify-between mb-6 px-0.5">
              <div className="space-y-2">
                <div className="h-7 w-28 bg-neutral-800 rounded animate-pulse" />
                <div className="h-3 w-12 bg-neutral-800 rounded animate-pulse" />
              </div>
              <div className="flex gap-2">
                <div className="h-10 w-10 rounded-full bg-neutral-800 animate-pulse" />
                <div className="h-10 w-10 rounded-full bg-neutral-800 animate-pulse" />
              </div>
            </div>
            <div className="grid grid-cols-7 gap-1 text-center mb-4">
              {Array.from({ length: 7 }).map((_, i) => (
                <div
                  key={i}
                  className="h-3 w-3 mx-auto rounded bg-neutral-800 animate-pulse"
                />
              ))}
            </div>
            <div className="grid grid-cols-7 gap-y-2 gap-x-1">
              {Array.from({ length: 7 }).map((_, i) => (
                <div key={`e-${i}`} className="aspect-square min-h-[44px]" />
              ))}
              {Array.from({ length: 28 }).map((_, i) => (
                <div
                  key={i}
                  className="aspect-square min-h-[44px] rounded-2xl bg-neutral-800/80 animate-pulse"
                />
              ))}
            </div>
          </div>

          <div className="space-y-3">
            <div className="h-7 w-36 bg-neutral-800 rounded animate-pulse" />
            <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
              {Array.from({ length: 8 }).map((_, i) => (
                <div
                  key={i}
                  className="min-h-[48px] rounded-xl bg-neutral-800 animate-pulse"
                />
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="fixed bottom-0 left-0 right-0 z-20 border-t border-white/10 bg-[var(--dashboard-bg)]/95 p-4">
        <div className="max-w-2xl mx-auto">
          <div className="h-12 w-full rounded-xl bg-neutral-800 animate-pulse" />
        </div>
      </div>
    </div>
  );
}
