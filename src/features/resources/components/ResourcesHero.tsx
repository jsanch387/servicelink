import { RESOURCES_HERO } from '../data/resourcesSeoContent';

export function ResourcesHero() {
  return (
    <header className="mb-8 sm:mb-10 max-w-3xl">
      <h1 className="text-3xl sm:text-4xl md:text-5xl font-extrabold text-white tracking-tight leading-[1.1]">
        {RESOURCES_HERO.title}
      </h1>
      <p className="mt-3 text-lg sm:text-xl text-gray-300 leading-snug">
        {RESOURCES_HERO.subtitle}
      </p>
      <p className="mt-4 text-sm sm:text-base text-gray-400 leading-relaxed">
        {RESOURCES_HERO.description}
      </p>
    </header>
  );
}
