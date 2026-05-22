import { WORKSHOP_HERO } from '../data/workshopSeoContent';

export function AdsWorkshopHero() {
  return (
    <header className="max-w-3xl mx-auto px-4 sm:px-6 pt-4 sm:pt-6 pb-8 sm:pb-10 text-center">
      <p className="inline-block text-xs font-semibold tracking-widest text-white/90 uppercase bg-white/10 border border-white/20 px-3 py-1 rounded-full">
        {WORKSHOP_HERO.eyebrow}
      </p>
      <h1 className="mt-4 text-3xl sm:text-4xl md:text-5xl font-extrabold tracking-tight text-white leading-[1.1]">
        {WORKSHOP_HERO.title}
      </h1>
      <p className="mt-4 text-base sm:text-lg text-gray-400 max-w-xl mx-auto leading-relaxed">
        {WORKSHOP_HERO.subtitle}
      </p>
    </header>
  );
}
