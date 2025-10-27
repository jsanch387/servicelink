import React from 'react';
import { BenefitsSection } from './BenefitsSection';
import { FeaturesSection } from './FeaturesSection';
import { Footer } from './Footer';
import { HeroSection } from './HeroSection';
import { Navigation } from './Navigation';
import { TestimonialsSection } from './TestimonialsSection';

export const LandingPage: React.FC = () => {
  return (
    <div className="min-h-screen bg-neutral-900">
      <Navigation />
      <HeroSection />
      <FeaturesSection />
      <TestimonialsSection />
      <BenefitsSection />
      <Footer />
    </div>
  );
};
