/**
 * Skeleton when opening `/book` without a service (service picker).
 */

export function BookPickerLoadingSkeleton() {
  return (
    <div className="min-h-[50vh] bg-[var(--dashboard-bg)] px-4 sm:px-6 pt-6 pb-24 max-w-2xl mx-auto">
      <div className="sticky top-0 z-10 -mx-4 sm:-mx-6 px-4 sm:px-6 py-4 mb-6 border-b border-white/10 bg-[var(--dashboard-bg)]/95 backdrop-blur-sm">
        <div className="h-5 w-28 bg-neutral-800 rounded animate-pulse" />
      </div>
      <div className="space-y-2 mb-8">
        <div className="h-8 w-64 max-w-full bg-neutral-800 rounded-lg animate-pulse" />
        <div className="h-4 w-full max-w-md bg-neutral-800 rounded animate-pulse" />
      </div>
      <div className="grid grid-cols-1 gap-4">
        {[1, 2, 3].map(i => (
          <div
            key={i}
            className="rounded-2xl border border-white/10 bg-white/[0.02] p-5 animate-pulse"
          >
            <div className="h-6 w-48 bg-neutral-800 rounded mb-3" />
            <div className="h-4 w-full bg-neutral-800/80 rounded mb-2" />
            <div className="h-4 w-[85%] bg-neutral-800/80 rounded mb-4" />
            <div className="flex justify-between items-center pt-2">
              <div className="h-4 w-20 bg-neutral-800 rounded" />
              <div className="h-4 w-16 bg-neutral-800 rounded" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
