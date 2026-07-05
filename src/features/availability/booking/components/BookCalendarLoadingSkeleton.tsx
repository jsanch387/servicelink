/**
 * Loading UI for /[slug]/book when a service is already selected — calendar + time slots.
 */

export function BookCalendarLoadingSkeleton() {
  return (
    <div className="min-h-screen bg-[var(--dashboard-bg)]">
      <div className="sticky top-0 z-10 border-b border-white/10 bg-[var(--dashboard-bg)]/95 backdrop-blur-sm">
        <div className="mx-auto max-w-2xl px-4 py-4 sm:px-6">
          <div className="h-5 w-32 animate-pulse rounded bg-neutral-800" />
        </div>
      </div>

      <div className="mx-auto max-w-2xl px-4 pb-28 pt-6 sm:px-6">
        <div className="space-y-6 pt-4">
          <section>
            <div className="flex items-start justify-between gap-4">
              <div className="min-w-0 flex-1 space-y-2">
                <div className="h-6 max-w-full animate-pulse rounded bg-neutral-800 w-48" />
                <div className="h-4 w-36 animate-pulse rounded bg-neutral-800" />
              </div>
              <div className="mt-0.5 h-5 w-16 shrink-0 animate-pulse rounded bg-neutral-800" />
            </div>
          </section>

          <div className="w-full rounded-2xl border border-white/10 bg-white/[0.02] p-4 shadow-xl sm:max-w-[360px] sm:p-6">
            <div className="mb-6 flex items-center justify-between px-0.5">
              <div className="space-y-2">
                <div className="h-7 w-28 animate-pulse rounded bg-neutral-800" />
                <div className="h-3 w-12 animate-pulse rounded bg-neutral-800" />
              </div>
              <div className="flex gap-2">
                <div className="h-10 w-10 animate-pulse rounded-full bg-neutral-800" />
                <div className="h-10 w-10 animate-pulse rounded-full bg-neutral-800" />
              </div>
            </div>
            <div className="mb-4 grid grid-cols-7 gap-1 text-center">
              {Array.from({ length: 7 }).map((_, i) => (
                <div
                  key={i}
                  className="mx-auto h-3 w-3 animate-pulse rounded bg-neutral-800"
                />
              ))}
            </div>
            <div className="grid grid-cols-7 gap-x-1 gap-y-2">
              {Array.from({ length: 7 }).map((_, i) => (
                <div key={`e-${i}`} className="aspect-square min-h-[44px]" />
              ))}
              {Array.from({ length: 28 }).map((_, i) => (
                <div
                  key={i}
                  className="aspect-square min-h-[44px] animate-pulse rounded-2xl bg-neutral-800/80"
                />
              ))}
            </div>
          </div>

          <div className="space-y-3">
            <div className="h-7 w-36 animate-pulse rounded bg-neutral-800" />
            <div className="grid grid-cols-3 gap-2 sm:grid-cols-4">
              {Array.from({ length: 8 }).map((_, i) => (
                <div
                  key={i}
                  className="min-h-[48px] animate-pulse rounded-xl bg-neutral-800"
                />
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="fixed bottom-0 left-0 right-0 z-20 border-t border-white/10 bg-[var(--dashboard-bg)]/95 p-4">
        <div className="mx-auto max-w-2xl">
          <div className="h-12 w-full animate-pulse rounded-xl bg-neutral-800" />
        </div>
      </div>
    </div>
  );
}
