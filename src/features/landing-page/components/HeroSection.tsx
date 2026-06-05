'use client';

import { ROUTES } from '@/constants/routes';
import React from 'react';
import { HeroAppStoreBadges } from './HeroAppStoreBadges';
import { HeroCtaButton } from './HeroCtaButton';
import { HeroFloatingCards } from './HeroFloatingCards';
import { HeroFloatingConnectors } from './HeroFloatingConnectors';
import { HeroVisualGlow } from './HeroVisualGlow';
import { LandingPageDisplayImage } from './LandingPageDisplayImage';

export const HeroSection: React.FC = () => {
  return (
    <section
      className="relative pt-28 sm:pt-32 pb-16 sm:pb-20 px-4 sm:px-6 overflow-visible"
      aria-labelledby="hero-heading"
    >
      <HeroVisualGlow />
      <div className="max-w-7xl mx-auto flex flex-col items-center text-center">
        <h1
          id="hero-heading"
          className="logo-text text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-extrabold mb-4 sm:mb-5 tracking-tight leading-[1.08] text-white uppercase max-w-4xl"
        >
          MORE BOOKINGS.{' '}
          <span className="bg-clip-text text-transparent bg-gradient-to-r from-white to-gray-400">
            LESS BACK-AND-FORTH.
          </span>
        </h1>

        <p className="text-base sm:text-lg text-gray-400 mb-6 sm:mb-8 leading-relaxed font-medium max-w-2xl">
          One booking link for your customers. One dashboard to run your
          business.
        </p>

        <HeroCtaButton href={ROUTES.AUTH.SIGNUP} className="mb-0">
          Get Started
        </HeroCtaButton>
      </div>

      <div className="relative -mt-3 sm:-mt-4 mx-auto w-full max-w-[1320px]">
        <HeroFloatingConnectors />
        <LandingPageDisplayImage
          variant="hero"
          className="relative z-[1] w-full max-sm:-mx-4 max-sm:w-[calc(100%+2rem)] sm:mx-0"
        />
        <HeroFloatingCards />
      </div>

      <div className="max-w-7xl mx-auto flex flex-col items-center text-center">
        <HeroAppStoreBadges />
      </div>
    </section>
  );
};
