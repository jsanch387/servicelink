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
      {/* Galaxy-style background glows + shooting stars - subtle, fixed behind content */}
      <div className="fixed inset-0 z-0 pointer-events-none" aria-hidden>
        {/* Glow top-right */}
        <div
          className="absolute -top-[20%] -right-[10%] w-[70vmax] h-[70vmax] rounded-full"
          style={{
            background:
              'radial-gradient(circle, rgba(255,255,255,0.06) 0%, rgba(200,220,255,0.03) 40%, transparent 70%)',
          }}
        />
        {/* Glow bottom-left */}
        <div
          className="absolute -bottom-[30%] -left-[15%] w-[60vmax] h-[60vmax] rounded-full"
          style={{
            background:
              'radial-gradient(circle, rgba(255,255,255,0.05) 0%, rgba(220,200,255,0.025) 50%, transparent 70%)',
          }}
        />
        {/* Center glow */}
        <div
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[100vmax] h-[80vmin] rounded-full"
          style={{
            background:
              'radial-gradient(ellipse, rgba(255,255,255,0.04) 0%, transparent 60%)',
          }}
        />
        {/* Shooting star streak - diagonal */}
        <div
          className="absolute w-[120%] top-[15%] -left-[10%] rotate-[-25deg] h-[2px] blur-[1px]"
          style={{
            background:
              'linear-gradient(90deg, transparent 0%, transparent 25%, rgba(255,255,255,0.35) 40%, rgba(255,255,255,0.12) 55%, transparent 75%, transparent 100%)',
          }}
        />
        {/* Second streak */}
        <div
          className="absolute w-[80%] top-[52%] right-[-20%] rotate-[-20deg] h-[2px] blur-[1px]"
          style={{
            background:
              'linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.25) 35%, rgba(255,255,255,0.08) 55%, transparent 100%)',
          }}
        />
      </div>
      <div className="relative z-10">
        <Navigation />
        <main id="main-content" aria-label="Main content">
          <HeroSection />
          <TrustedByStripSection />
          <DetailerFeaturesSection />
          <HowItWorksSection />
          <TestimonialsSection />
          <ProblemSolutionSection />
          <FAQSection />
        </main>
        <Footer />
      </div>
    </div>
  );
};
