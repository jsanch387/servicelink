export default function DashboardPaymentsTransactionsLoading() {
  return (
    <main className="flex-1 py-8 sm:py-10 px-4 sm:px-6 lg:px-8 overflow-x-hidden overflow-y-auto bg-[var(--dashboard-bg)] min-h-screen w-full">
      <div className="max-w-3xl mx-auto w-full min-w-0 space-y-6">
        <div className="h-8 w-44 bg-white/10 rounded-lg animate-pulse" />
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <div className="h-24 rounded-2xl border border-white/10 bg-white/[0.02] animate-pulse" />
          <div className="h-24 rounded-2xl border border-white/10 bg-white/[0.02] animate-pulse" />
        </div>
        <div className="space-y-3">
          {[1, 2, 3, 4].map(row => (
            <div
              key={row}
              className="h-[4.5rem] rounded-xl border border-white/[0.06] bg-white/[0.03] animate-pulse"
            />
          ))}
        </div>
      </div>
    </main>
  );
}
