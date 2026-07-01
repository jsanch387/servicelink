/**
 * Loading UI for /[slug]/book when no service is selected — mirrors BookServicePicker.
 */

export function BookServicePickerLoadingSkeleton() {
  return (
    <div className="min-h-screen bg-[var(--dashboard-bg)]">
      <div className="sticky top-0 z-10 border-b border-white/10 bg-[var(--dashboard-bg)]/95 backdrop-blur-sm">
        <div className="mx-auto max-w-2xl px-4 py-4 sm:px-6">
          <div className="h-5 w-32 animate-pulse rounded bg-neutral-800" />
        </div>
      </div>

      <div className="mx-auto flex min-h-[60vh] w-full max-w-2xl flex-col px-4 pb-16 pt-6 sm:px-6 sm:pb-24">
        <header className="mb-6 space-y-2">
          <div className="h-7 max-w-sm animate-pulse rounded-lg bg-neutral-800" />
          <div className="h-4 max-w-md animate-pulse rounded bg-neutral-700" />
        </header>

        <div className="space-y-2" aria-hidden>
          {[1, 2, 3, 4].map(i => (
            <div
              key={i}
              className="flex min-h-[52px] animate-pulse items-center justify-between gap-3 rounded-xl border border-white/10 bg-white/[0.04] p-4"
            >
              <div className="h-6 w-6 shrink-0 rounded-full border border-white/20" />
              <div className="min-w-0 flex-1 space-y-2">
                <div className="h-5 max-w-[55%] rounded bg-neutral-700" />
                <div className="h-3 w-24 rounded bg-neutral-700/80" />
              </div>
              <div className="h-5 w-14 shrink-0 rounded bg-neutral-700" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
