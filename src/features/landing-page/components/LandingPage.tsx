import React from 'react';
import { Navigation } from './Navigation';
import { HeroSection } from './HeroSection';
import { FeaturesSection } from './FeaturesSection';
import { WaitlistSection } from './WaitlistSection';
import { Footer } from './Footer';

export const LandingPage: React.FC = () => {
  return (
    <div className="min-h-screen bg-neutral-900">
      <Navigation />
      <HeroSection />
      <FeaturesSection />
      <WaitlistSection />
      <Footer />
    </div>
  );
};
