const MARKETPLACE_STEPS = [
  {
    number: '1',
    title: 'Start with your location',
    description: 'Enter your city or ZIP code.',
  },
  {
    number: '2',
    title: 'Choose your detailer',
    description: 'Compare nearby detailers and find the right service.',
  },
  {
    number: '3',
    title: 'Book a time',
    description: 'Select a service and an available time.',
  },
] as const;

export function MarketplaceDiscovery() {
  return (
    <section className="border-t border-[var(--dashboard-border)] bg-white/[0.015] px-4 pb-20 pt-12 sm:px-6 sm:pb-24 sm:pt-14 lg:px-8">
      <div className="mx-auto max-w-6xl">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="logo-text text-2xl font-extrabold uppercase leading-[1.08] tracking-tight text-white sm:text-3xl lg:text-4xl">
            Find your detailer.
            <span className="block bg-gradient-to-r from-white to-gray-500 bg-clip-text text-transparent">
              Book your time.
            </span>
          </h2>
        </div>

        <ol className="relative mt-16 grid gap-10 md:min-h-[390px] md:grid-cols-3 md:gap-12">
          <svg
            className="pointer-events-none absolute inset-x-0 top-0 hidden h-40 w-full md:block"
            viewBox="0 0 1000 160"
            fill="none"
            preserveAspectRatio="none"
            aria-hidden
          >
            <defs>
              <linearGradient
                id="marketplace-path"
                x1="167"
                y1="0"
                x2="833"
                y2="0"
              >
                <stop stopColor="white" stopOpacity="0.26" />
                <stop offset="0.5" stopColor="white" stopOpacity="0.12" />
                <stop offset="1" stopColor="white" stopOpacity="0.26" />
              </linearGradient>
            </defs>
            <path
              d="M167 18C310 18 350 140 500 140C650 140 690 18 833 18"
              stroke="url(#marketplace-path)"
              strokeWidth="1.5"
              strokeDasharray="5 7"
            />
          </svg>

          {MARKETPLACE_STEPS.map(({ number, title, description }, index) => (
            <li
              key={number}
              className={`relative pl-8 md:pl-0 md:text-center ${
                index === 1 ? 'md:pt-44' : 'md:pt-16'
              }`}
            >
              {index < MARKETPLACE_STEPS.length - 1 && (
                <span
                  className="pointer-events-none absolute left-1 top-5 h-[calc(100%+2.5rem)] w-px bg-gradient-to-b from-white/20 to-white/[0.04] md:hidden"
                  aria-hidden
                />
              )}
              <span
                className={`absolute left-0 h-2.5 w-2.5 -translate-x-px rounded-full border border-white/40 bg-gray-300 shadow-[0_0_0_6px_var(--dashboard-bg)] md:left-1/2 md:-translate-x-1/2 ${
                  index === 1 ? 'top-4 md:top-[8.45rem]' : 'top-4 md:top-3.5'
                }`}
                aria-hidden
              />
              <span className="block text-4xl font-semibold tracking-[-0.05em] text-white/25 md:text-6xl">
                {number}
              </span>
              <div className="mt-4">
                <h3 className="text-xl font-semibold tracking-tight text-white">
                  {title}
                </h3>
                <p className="mt-2 max-w-xs text-sm leading-6 text-gray-500 md:mx-auto">
                  {description}
                </p>
              </div>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}
