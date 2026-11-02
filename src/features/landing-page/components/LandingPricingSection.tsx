'use client';

import { FREE_BOOKINGS_LIMIT, TEAM_SEAT_LIMIT } from '@/features/pricing';
import { PublicPricingPlans } from '@/features/pricing/components/PublicPricingPlans';
import React from 'react';

/**
 * Landing page pricing section with monthly/yearly toggle for Pro and Team.
 */
export const LandingPricingSection: React.FC = () => {
  return (
    <section
      id="pricing"
      className="scroll-mt-24 py-16 sm:py-24 md:py-28 px-4 sm:px-6"
      aria-labelledby="landing-pricing-heading"
    >
      <div className="max-w-6xl mx-auto">
        <div className="mx-auto mb-10 max-w-2xl text-center sm:mb-12">
          <h2
            id="landing-pricing-heading"
            className="text-3xl sm:text-4xl md:text-5xl font-extrabold text-white tracking-tight"
          >
            Simple, transparent pricing
          </h2>
          <p className="mt-4 text-sm sm:text-base text-gray-400 leading-relaxed">
            Try it with {FREE_BOOKINGS_LIMIT} appointments. Pro is the full set
            of tools. Team is for up to {TEAM_SEAT_LIMIT} people on the shop.
            Pay monthly, or save two months with yearly.
          </p>
        </div>

        <PublicPricingPlans />
      </div>
    </section>
  );
};
