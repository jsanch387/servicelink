'use client';

import React from 'react';
import { PublicPricingPlans } from '@/features/pricing/components/PublicPricingPlans';

/**
 * Landing page pricing section with monthly/yearly Pro toggle.
 */
export const LandingPricingSection: React.FC = () => {
  return (
    <section
      id="pricing"
      className="py-16 sm:py-24 md:py-28 px-4 sm:px-6"
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
            Start free, then upgrade when you are ready. Pay monthly or save two
            months with yearly Pro.
          </p>
        </div>

        <PublicPricingPlans />
      </div>
    </section>
  );
};
