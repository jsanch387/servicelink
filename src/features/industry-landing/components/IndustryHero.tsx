import { HeroCtaButton } from '@/features/landing-page/components/HeroCtaButton';
import { HeroVisualGlow } from '@/features/landing-page/components/HeroVisualGlow';
import { siteSignupPath } from '@/features/marketing-attribution';
import type { IndustryLandingContent } from '../types';
import { HeroProductStage } from './visuals/HeroProductStage';

export function IndustryHero({ content }: { content: IndustryLandingContent }) {
  return (
    <section className="relative overflow-hidden px-4 pb-24 pt-10 sm:px-6 sm:pb-28 sm:pt-14 lg:pt-16">
      <HeroVisualGlow />
      <div className="relative mx-auto flex max-w-4xl flex-col items-center text-center">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-zinc-500">
          {content.hero.eyebrow}
        </p>
        <h1 className="logo-text mt-5 max-w-3xl text-3xl font-extrabold leading-[1.08] tracking-tight text-white sm:text-5xl lg:text-[3.5rem]">
          {content.hero.h1}{' '}
          <span className="text-zinc-400">{content.hero.h1Accent}</span>
        </h1>
        <p className="mt-5 max-w-md text-base font-medium leading-relaxed text-zinc-400 sm:mt-6 sm:text-lg">
          {content.hero.sub}
        </p>
        <div className="mt-8 sm:mt-10">
          <HeroCtaButton href={siteSignupPath('auto-detailing', 'hero')}>
            Start free
          </HeroCtaButton>
        </div>
      </div>
      <div className="relative mt-14 sm:mt-16 md:mt-20 md:pb-16">
        <HeroProductStage />
      </div>
    </section>
  );
}
