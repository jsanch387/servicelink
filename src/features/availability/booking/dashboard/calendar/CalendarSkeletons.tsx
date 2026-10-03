export function CalendarListSkeleton() {
  return (
    <div className="space-y-3" aria-hidden>
      <div className="h-4 w-40 rounded bg-white/10" />
      <div className="hidden overflow-hidden rounded-lg border border-white/10 md:block">
        {Array.from({ length: 4 }, (_, index) => (
          <div
            key={index}
            className="flex animate-pulse gap-6 border-b border-white/5 px-4 py-4 last:border-0"
          >
            <div className="h-4 w-16 rounded bg-white/10" />
            <div className="h-4 w-36 rounded bg-white/10" />
            <div className="h-4 flex-1 rounded bg-white/10" />
            <div className="h-5 w-20 rounded-lg bg-white/10" />
          </div>
        ))}
      </div>
      <div className="space-y-3 md:hidden">
        {Array.from({ length: 3 }, (_, index) => (
          <div
            key={index}
            className="h-28 animate-pulse rounded-lg border border-white/10 bg-white/[0.02]"
          />
        ))}
      </div>
    </div>
  );
}

export function CalendarRangeSkeleton() {
  return (
    <div className="animate-pulse space-y-2" aria-hidden>
      {Array.from({ length: 8 }, (_, index) => (
        <div key={index} className="flex items-start gap-3">
          <div className="mt-2 h-3 w-10 shrink-0 rounded bg-white/10" />
          <div className="h-14 flex-1 rounded-xl bg-white/[0.06]" />
        </div>
      ))}
    </div>
  );
}
