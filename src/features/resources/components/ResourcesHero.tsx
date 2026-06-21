import { RESOURCES_HERO } from '../data/resourcesSeoContent';

export function ResourcesHero() {
  return (
    <header className="mb-10 sm:mb-12 max-w-2xl">
      <h1 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight leading-tight">
        {RESOURCES_HERO.title}
      </h1>
      <p className="mt-3 text-base sm:text-lg text-gray-400 leading-relaxed">
        {RESOURCES_HERO.subtitle}
      </p>
    </header>
  );
}
