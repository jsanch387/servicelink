import React from 'react';
import { LandingSignupCta } from './LandingSignupCta';

export function LandingCloseCta() {
  return (
    <section className="px-4 pb-16 sm:px-6 sm:pb-20" aria-label="Start free">
      <LandingSignupCta
        line="Start free. Your booking page in minutes."
        showPricing
      />
    </section>
  );
}
