import { RESOURCES_HERO } from '../data/resourcesSeoContent';

export function ResourcesHero() {
  return (
    <header className="mb-10 sm:mb-14 max-w-3xl">
      <h1 className="text-3xl sm:text-4xl md:text-5xl font-extrabold text-white tracking-tight leading-[1.1]">
        {RESOURCES_HERO.title}
      </h1>
      <p className="mt-4 text-base sm:text-lg text-gray-400 leading-relaxed max-w-2xl">
        {RESOURCES_HERO.subtitle}
      </p>
    </header>
  );
}
