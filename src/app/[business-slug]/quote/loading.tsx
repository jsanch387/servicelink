/**
 * Loading state for public quote request page ([business-slug]/quote).
 * Mirrors the public quote UI: back link, heading, form card, sticky action bar.
 */
export default function PublicQuoteRequestLoading() {
  return (
    <main className="min-h-screen bg-[var(--dashboard-bg)] px-4 pb-32 pt-6 sm:px-6 sm:pb-32 sm:pt-8">
      <div className="mx-auto w-full max-w-3xl">
        <div className="mb-6 h-5 w-36 animate-pulse rounded bg-neutral-800" />
        <div className="h-8 w-48 animate-pulse rounded bg-neutral-800 sm:h-9" />
        <div className="mt-2 h-4 w-80 max-w-full animate-pulse rounded bg-neutral-800" />
        <div className="mt-4 h-px w-full bg-white/10" />

        <div className="mt-6 w-full max-w-xl rounded-2xl border border-white/10 bg-white/[0.02] p-4 sm:p-6">
          <div className="mb-4 h-4 w-32 animate-pulse rounded bg-neutral-800" />
          <div className="space-y-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="space-y-2">
                <div className="h-4 w-24 animate-pulse rounded bg-neutral-800" />
                <div className="h-12 w-full animate-pulse rounded-xl bg-neutral-800" />
              </div>
            ))}
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <div className="h-4 w-28 animate-pulse rounded bg-neutral-800" />
                <div className="h-12 w-full animate-pulse rounded-xl bg-neutral-800" />
              </div>
              <div className="space-y-2">
                <div className="h-4 w-24 animate-pulse rounded bg-neutral-800" />
                <div className="h-12 w-full animate-pulse rounded-xl bg-neutral-800" />
              </div>
            </div>
            <div className="space-y-2">
              <div className="h-4 w-40 animate-pulse rounded bg-neutral-800" />
              <div className="h-28 w-full animate-pulse rounded-xl bg-neutral-800" />
            </div>
          </div>
        </div>
      </div>

      <div
        className="safe-area-pb fixed bottom-0 left-0 right-0 z-20 border-t border-white/10 bg-[var(--dashboard-bg)]/95 p-4 backdrop-blur-sm"
        style={{ paddingBottom: 'max(1rem, env(safe-area-inset-bottom))' }}
      >
        <div className="mx-auto w-full max-w-xl">
          <div className="h-12 w-full animate-pulse rounded-xl bg-neutral-800" />
        </div>
      </div>
    </main>
  );
}

