export default function DashboardPaymentsLoading() {
  return (
    <main className="flex-1 py-8 sm:py-10 px-4 sm:px-6 lg:px-8 overflow-x-hidden overflow-y-auto bg-[var(--dashboard-bg)] min-h-screen w-full">
      <div className="max-w-3xl mx-auto w-full min-w-0">
        <div className="mb-6 sm:mb-8 space-y-2">
          <div className="h-8 w-36 max-w-[60%] bg-white/10 rounded-lg animate-pulse" />
          <div className="h-4 w-full max-w-md bg-white/10 rounded animate-pulse" />
        </div>
        <div className="mb-6 flex gap-2">
          <div className="h-9 w-20 rounded-full bg-white/10 animate-pulse" />
          <div className="h-9 w-28 rounded-full bg-white/10 animate-pulse" />
          <div className="h-9 w-20 rounded-full bg-white/10 animate-pulse" />
        </div>
        <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-4 sm:p-6 animate-pulse">
          <div className="h-3 w-20 bg-white/10 rounded mb-3" />
          <div className="h-8 w-36 bg-white/10 rounded mb-5" />
          <div className="h-48 bg-white/[0.04] rounded-xl" />
        </div>
      </div>
    </main>
  );
}
