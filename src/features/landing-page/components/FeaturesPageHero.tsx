import { FEATURES_HERO } from '../data/featuresSeoContent';

export function FeaturesPageHero() {
  return (
    <header className="mb-8 sm:mb-10 text-center max-w-3xl mx-auto">
      <h1 className="text-3xl sm:text-4xl md:text-5xl font-extrabold text-white tracking-tight leading-[1.1]">
        {FEATURES_HERO.title}
      </h1>
      <p className="sr-only">{FEATURES_HERO.seoDescription}</p>
      <div className="mt-3 inline-flex flex-col items-stretch">
        <p className="text-base sm:text-lg text-gray-400">
          {FEATURES_HERO.subtitle}
        </p>

        <div className="relative mt-6 h-px w-full" aria-hidden>
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent" />
          <div className="absolute inset-x-[12%] inset-y-0 bg-gradient-to-r from-transparent via-slate-300/90 to-transparent shadow-[0_0_18px_rgba(203,213,225,0.5)]" />
          <div className="absolute inset-x-[8%] -inset-y-1 bg-gradient-to-r from-transparent via-slate-400/35 to-transparent blur-sm" />
        </div>
      </div>
    </header>
  );
}
