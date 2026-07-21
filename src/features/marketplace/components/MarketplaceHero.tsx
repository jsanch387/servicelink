import {
  CalendarDaysIcon,
  CheckBadgeIcon,
  MapPinIcon,
} from '@heroicons/react/24/outline';

const MARKETPLACE_BENEFITS = [
  { label: 'Nearby detailers', icon: MapPinIcon },
  { label: 'Compare services', icon: CheckBadgeIcon },
  { label: 'Simple booking', icon: CalendarDaysIcon },
] as const;

export const MarketplaceHero = () => {
  return (
    <div className="mx-auto max-w-4xl text-center animate-hero-float-in">
      <h1 className="pb-2 text-balance text-5xl font-black uppercase leading-[1.08] tracking-[-0.045em] text-white sm:text-7xl lg:text-8xl">
        <span className="block bg-gradient-to-r from-white via-gray-200 to-gray-400 bg-clip-text text-transparent">
          Find a detailer
        </span>
        <span className="mt-2 block whitespace-nowrap pb-1 text-[1.35rem] font-semibold tracking-[-0.03em] sm:mt-3 sm:text-4xl lg:text-5xl">
          near you, when you need one.
        </span>
      </h1>

      <div className="mt-7 flex flex-wrap items-center justify-center gap-x-7 gap-y-3">
        {MARKETPLACE_BENEFITS.map(({ label, icon: Icon }, index) => (
          <div key={label} className="flex items-center gap-7">
            {index > 0 && (
              <span
                className="hidden h-4 w-px bg-white/10 sm:block"
                aria-hidden
              />
            )}
            <span className="inline-flex items-center gap-2.5 text-sm font-medium text-gray-300">
              <Icon className="h-4 w-4 text-gray-500" aria-hidden />
              {label}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
};
