import { HeroCtaButton } from '@/features/landing-page/components/HeroCtaButton';
import { siteSignupPath } from '@/features/marketing-attribution';
import type { IndustryLandingContent } from '../types';
import { BookingPagePhoneMock } from './visuals/BookingPagePhoneMock';

export function IndustryHero({ content }: { content: IndustryLandingContent }) {
  return (
    <section className="relative overflow-hidden px-4 pb-16 pt-10 sm:px-6 sm:pb-20 sm:pt-14">
      <div
        className="pointer-events-none absolute inset-x-0 top-0 h-72 bg-[radial-gradient(ellipse_at_top,rgba(255,255,255,0.07),transparent_60%)]"
        aria-hidden
      />
      <div className="relative mx-auto grid max-w-6xl items-center gap-12 lg:grid-cols-[1fr_280px] lg:gap-16">
        <div className="text-center lg:text-left">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-gray-500">
            {content.hero.eyebrow}
          </p>
          <h1 className="mt-4 max-w-xl text-3xl font-extrabold leading-[1.12] tracking-tight text-white sm:text-4xl md:text-5xl lg:max-w-none">
            {content.hero.h1}{' '}
            <span className="text-zinc-400">{content.hero.h1Accent}</span>
          </h1>
          <p className="mx-auto mt-4 max-w-md text-base font-medium leading-relaxed text-zinc-400 sm:text-lg lg:mx-0">
            {content.hero.sub}
          </p>
          <div className="mt-8 flex justify-center lg:justify-start">
            <HeroCtaButton href={siteSignupPath('auto-detailing', 'hero')}>
              Start free
            </HeroCtaButton>
          </div>
        </div>
        <BookingPagePhoneMock />
      </div>
    </section>
  );
}
