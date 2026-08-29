import { MarketingGalaxyBackground } from '@/components/shared';
import React from 'react';
import { FAQSection } from './FAQSection';
import { HeroSection } from './HeroSection';
import { LandingCloseCta } from './LandingCloseCta';
import { LandingFeatureTrio } from './LandingFeatureTrio';
import { LandingHowItWorksSteps } from './LandingHowItWorksSteps';
import { LandingPageStructuredData } from './LandingPageStructuredData';
import { LandingStatsBar } from './LandingStatsBar';
import { LandingInstagramSection } from './LandingInstagramSection';
import { MarketingFooter } from './MarketingFooter';
import { MarketingNavigation } from './MarketingNavigation';
import { TestimonialsSection } from './TestimonialsSection';

export const LandingPage: React.FC = () => {
  return (
    <div className="min-h-screen bg-[var(--dashboard-bg)] relative overflow-x-hidden">
      <LandingPageStructuredData />
      <MarketingGalaxyBackground />
      <div className="relative z-10">
        <MarketingNavigation />
        <main id="main-content" aria-label="Main content">
          <HeroSection />
          <LandingStatsBar />
          <TestimonialsSection />
          <LandingHowItWorksSteps />
          <LandingFeatureTrio />
          <LandingInstagramSection />
          <FAQSection />
          <LandingCloseCta />
        </main>
        <MarketingFooter />
      </div>
    </div>
  );
};
