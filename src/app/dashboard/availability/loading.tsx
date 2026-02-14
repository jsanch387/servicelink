/**
 * Loading state for Availability page
 */
export default function AvailabilityLoading() {
  return (
    <div className="flex-1 py-8 sm:py-10 px-4 sm:px-6 lg:px-8 bg-[var(--dashboard-bg)] min-h-screen">
      <div className="max-w-2xl mx-auto">
        <div className="mb-10">
          <div className="h-8 w-40 bg-white/10 rounded-lg animate-pulse" />
          <div className="h-4 w-64 mt-2 bg-white/5 rounded animate-pulse" />
        </div>
        <div className="space-y-8">
          {[1, 2, 3, 4].map(i => (
            <div
              key={i}
              className="rounded-2xl border border-white/10 bg-white/[0.02] p-6 sm:p-8"
            >
              <div className="h-5 w-48 bg-white/10 rounded animate-pulse mb-2" />
              <div className="h-4 w-72 bg-white/5 rounded animate-pulse" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
