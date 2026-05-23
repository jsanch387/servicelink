'use client';

import { ROUTES } from '@/constants/routes';
import React from 'react';
import { Button } from '@/components/shared';
import { AppStoreComingSoonBadge } from './AppStoreComingSoonBadge';
import { LandingPageDisplayImage } from './LandingPageDisplayImage';

export const HeroSection: React.FC = () => {
  return (
    <section
      className="relative pt-28 sm:pt-32 pb-16 sm:pb-20 px-4 sm:px-6"
      aria-labelledby="hero-heading"
    >
      <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-8 items-center">
        {/* Hero Text */}
        <div className="text-left">
          <h1
            id="hero-heading"
            className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-black mb-4 sm:mb-6 tracking-tight leading-[1.08] text-white uppercase"
          >
            MORE BOOKINGS. <br />
            <span className="bg-clip-text text-transparent bg-gradient-to-r from-white to-gray-400">
              LESS BACK-AND-FORTH.
            </span>
          </h1>

          <p className="text-base sm:text-lg text-gray-400 mb-6 sm:mb-8 md:mb-10 leading-relaxed font-medium max-w-xl">
            Give customers one clean booking link to view services, request
            quotes, and pay online. Run bookings, deposits, and customer
            follow-up from one dashboard.
          </p>

          {/* Hero CTA Buttons */}
          <div className="max-w-lg">
            <Button
              href={ROUTES.AUTH.SIGNUP}
              variant="inverse"
              size="lg"
              className="w-full sm:w-auto font-bold"
            >
              Get Started
            </Button>
            <AppStoreComingSoonBadge />
          </div>
        </div>

        <LandingPageDisplayImage
          variant="hero"
          className="mt-8 lg:mt-0 lg:justify-end"
        />
      </div>
    </section>
  );
};
