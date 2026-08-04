import { MarketingGalaxyBackground } from '@/components/shared';
import React from 'react';
import { DetailerFeaturesSection } from './DetailerFeaturesSection';
import { FAQSection } from './FAQSection';
import { HeroSection } from './HeroSection';
import { HowItWorksSection } from './HowItWorksSection';
import { LandingPageStructuredData } from './LandingPageStructuredData';
import { LandingPricingSection } from './LandingPricingSection';
import { MarketingFooter } from './MarketingFooter';
import { MarketingNavigation } from './MarketingNavigation';
import { ProblemSolutionSection } from './ProblemSolutionSection';
import { TestimonialsSection } from './TestimonialsSection';
import { TrustedByStripSection } from './TrustedByStripSection';

export const LandingPage: React.FC = () => {
  return (
    <div className="min-h-screen bg-[var(--dashboard-bg)] relative overflow-x-hidden">
      <LandingPageStructuredData />
      <MarketingGalaxyBackground />
      <div className="relative z-10">
        <MarketingNavigation />
        <main id="main-content" aria-label="Main content">
          <HeroSection />
          <TestimonialsSection />
          <TrustedByStripSection />
          <DetailerFeaturesSection />
          <HowItWorksSection />
          <ProblemSolutionSection />
          <LandingPricingSection />
          <FAQSection />
        </main>
        <MarketingFooter />
      </div>
    </div>
  );
};
