/**
 * Loading State for Business Profile Page
 * Matches the real layout: centered max-w-4xl, same structure as BusinessProfileView.
 */

export default function BusinessProfileLoading() {
  return (
    <div className="min-h-screen bg-[#0f0f0f]">
      <div className="max-w-4xl mx-auto">
        {/* Cover Photo Skeleton */}
        <div className="relative h-48 sm:h-56 md:h-64 w-full bg-neutral-800 animate-pulse" />

        {/* Profile Section Skeleton – centered */}
        <div className="relative px-6 -mt-16 z-10 flex flex-col items-center text-center">
          <div className="w-32 h-32 rounded-[2.4rem] bg-neutral-700 mb-6 animate-pulse" />
          <div className="h-9 bg-neutral-700 rounded-lg w-64 mb-2 animate-pulse" />
          <div className="h-4 bg-neutral-700 rounded w-32 mb-4 animate-pulse" />
          <div className="h-4 bg-neutral-700 rounded w-40 mb-6 animate-pulse" />
          <div className="space-y-2 mb-10">
            <div className="h-4 bg-neutral-700 rounded w-96 max-w-full animate-pulse" />
            <div className="h-4 bg-neutral-700 rounded w-80 max-w-full animate-pulse" />
          </div>
          <div className="grid grid-cols-2 gap-4 w-full max-w-sm px-2">
            <div className="h-12 bg-neutral-700 rounded-xl animate-pulse" />
            <div className="h-12 bg-neutral-700 rounded-xl animate-pulse" />
          </div>
        </div>

        {/* Tabs Skeleton */}
        <div className="px-4 sm:px-8 mt-8 border-b border-neutral-700">
          <div className="flex justify-center gap-8">
            <div className="h-6 bg-neutral-700 rounded w-20 animate-pulse" />
            <div className="h-6 bg-neutral-700 rounded w-24 animate-pulse" />
          </div>
        </div>

        {/* Services / Content Skeleton – grid of cards, not full width */}
        <div className="px-4 sm:px-8 py-8">
          <div className="grid grid-cols-1 gap-4">
            {[1, 2, 3].map(i => (
              <div
                key={i}
                className="bg-neutral-800 rounded-2xl border border-neutral-700/50 p-5 animate-pulse"
              >
                <div className="flex justify-between mb-3">
                  <div className="h-6 bg-neutral-700 rounded w-48" />
                  <div className="h-6 bg-neutral-700 rounded w-16" />
                </div>
                <div className="h-4 bg-neutral-700 rounded w-full mb-4" />
                <div className="h-4 bg-neutral-700 rounded w-3/4 mb-4" />
                <div className="h-6 bg-neutral-700 rounded w-24" />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
