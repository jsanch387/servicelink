import { siteSignupPath } from '@/features/marketing-attribution';
import React from 'react';
import { HeroAppStoreBadges } from './HeroAppStoreBadges';
import { HeroCtaButton } from './HeroCtaButton';
import { HeroVisualGlow } from './HeroVisualGlow';
import { LandingLiveShopsMarquee } from './LandingLiveShopsSection';

export const HeroSection: React.FC = () => {
  return (
    <section
      id="home"
      className="relative overflow-visible px-4 pb-16 pt-28 sm:px-6 sm:pb-20 sm:pt-32 md:pt-36"
      aria-labelledby="hero-heading"
    >
      <HeroVisualGlow />
      <div className="mx-auto flex max-w-7xl flex-col items-center text-center">
        <h1
          id="hero-heading"
          className="logo-text max-w-3xl text-3xl font-extrabold leading-[1.12] tracking-tight text-white sm:text-4xl md:text-5xl lg:text-[3.5rem]"
        >
          The booking software built for{' '}
          <span className="text-zinc-400">detailers.</span>
        </h1>

        <p className="mt-4 max-w-md text-base font-medium leading-relaxed text-zinc-400 sm:mt-5 sm:text-lg">
          Customers book and pay. You run the day.
        </p>

        <div className="mt-8 sm:mt-10">
          <HeroCtaButton href={siteSignupPath('homepage')}>
            Start free
          </HeroCtaButton>
        </div>
      </div>

      <div className="relative mt-14 sm:mt-16">
        <LandingLiveShopsMarquee />
      </div>

      <div className="mx-auto flex max-w-7xl flex-col items-center">
        <HeroAppStoreBadges className="mt-14 sm:mt-16" />
      </div>
    </section>
  );
};
