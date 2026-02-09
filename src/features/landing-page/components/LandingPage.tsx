import React from 'react';
import { Footer } from './Footer';
import { HeroSection } from './HeroSection';
import { HowItWorksSection } from './HowItWorksSection';
import { Navigation } from './Navigation';
import { PricingCTASection } from './PricingCTASection';
import { ProblemSolutionSection } from './ProblemSolutionSection';
import { TestimonialsSection } from './TestimonialsSection';

export const LandingPage: React.FC = () => {
  return (
    <div className="min-h-screen bg-[var(--dashboard-bg)]">
      <Navigation />
      <HeroSection />
      <HowItWorksSection />
      <ProblemSolutionSection />
      <TestimonialsSection />
      <PricingCTASection />
      <Footer />
    </div>
  );
};
