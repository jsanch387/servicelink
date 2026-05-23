import { WORKSHOP_HERO } from '../data/workshopSeoContent';

export function AdsWorkshopHero() {
  return (
    <header className="w-full pt-1 pb-6 sm:pb-8 text-center">
      <p className="inline-block text-sm font-medium text-white/80 bg-white/10 border border-white/15 px-3 py-1 rounded-full">
        {WORKSHOP_HERO.eyebrow}
      </p>
      <h1 className="mt-3 sm:mt-4 text-[1.625rem] leading-[1.2] sm:text-3xl md:text-4xl font-extrabold tracking-tight text-white text-balance max-w-2xl mx-auto">
        {WORKSHOP_HERO.title}
      </h1>
      <p className="mt-3 sm:mt-4 text-[0.9375rem] sm:text-base text-gray-400 max-w-xl mx-auto leading-relaxed text-pretty">
        {WORKSHOP_HERO.subtitle}
      </p>
    </header>
  );
}
