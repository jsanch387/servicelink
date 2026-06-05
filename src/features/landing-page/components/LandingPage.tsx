import { MarketingGalaxyBackground } from '@/components/shared';
import React from 'react';
import { DetailerFeaturesSection } from './DetailerFeaturesSection';
import { FAQSection } from './FAQSection';
import { Footer } from './Footer';
import { HeroSection } from './HeroSection';
import { HowItWorksSection } from './HowItWorksSection';
import { LandingPageStructuredData } from './LandingPageStructuredData';
import { Navigation } from './Navigation';
import { ProblemSolutionSection } from './ProblemSolutionSection';
import { TestimonialsSection } from './TestimonialsSection';
import { TrustedByStripSection } from './TrustedByStripSection';

export const LandingPage: React.FC = () => {
  return (
    <div className="min-h-screen bg-[var(--dashboard-bg)] relative overflow-x-hidden">
      <LandingPageStructuredData />
      <MarketingGalaxyBackground />
      <div className="relative z-10">
        <Navigation />
        <main id="main-content" aria-label="Main content">
          <HeroSection />
          <TestimonialsSection />
          <TrustedByStripSection />
          <DetailerFeaturesSection />
          <HowItWorksSection />
          <ProblemSolutionSection />
          <FAQSection />
        </main>
        <Footer />
      </div>
    </div>
  );
};
