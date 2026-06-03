'use client';

interface BookingsHeaderProps {
  businessName: string;
  statusFilter: 'all' | 'pending' | 'approved' | 'declined';
  onStatusFilterChange: (
    status: 'all' | 'pending' | 'approved' | 'declined'
  ) => void;
  statusCounts: {
    all: number;
    pending: number;
    approved: number;
    declined: number;
  };
}

export function BookingsHeader({
  statusFilter,
  onStatusFilterChange,
}: BookingsHeaderProps) {
  const filters = [
    { id: 'all' as const, label: 'All' },
    { id: 'pending' as const, label: 'Pending' },
    { id: 'approved' as const, label: 'Confirmed' },
    { id: 'declined' as const, label: 'Declined' },
  ];

  return (
    <header className="sticky top-0 z-10 bg-[#0f0f0f]/80 backdrop-blur-xl border-b border-white/[0.05] px-3 sm:px-4 md:px-6 lg:px-8 pt-4 sm:pt-6 md:pt-8 pb-3 sm:pb-4 w-full">
      <div className="max-w-xl lg:max-w-7xl mx-auto">
        <div className="mb-4 sm:mb-6">
          <h1 className="text-xl sm:text-2xl font-black tracking-tight truncate">
            Bookings
          </h1>
          <p className="text-zinc-500 text-xs sm:text-sm font-medium truncate">
            Manage your requests
          </p>
        </div>

        {/* Scrolling Filter Bar */}
        <div className="flex gap-1.5 sm:gap-2 overflow-x-auto pb-2 scrollbar-hide no-scrollbar -mx-3 sm:-mx-4 md:-mx-6 px-3 sm:px-4 md:px-6">
          {filters.map(f => (
            <button
              key={f.id}
              onClick={() => onStatusFilterChange(f.id)}
              className={`px-3 sm:px-4 py-1.5 sm:py-2 rounded-xl text-[12px] sm:text-[13px] font-bold whitespace-nowrap transition-all flex-shrink-0 cursor-pointer ${
                statusFilter === f.id
                  ? 'bg-white text-black'
                  : 'bg-[#1c1c1e] text-zinc-500 border border-white/[0.05]'
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>
    </header>
  );
}
