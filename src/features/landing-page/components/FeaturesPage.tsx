import React from 'react';
import { FeaturesPageCarousel } from './FeaturesPageCarousel';
import { FeaturesPageCta } from './FeaturesPageCta';
import { FeaturesPageFaq } from './FeaturesPageFaq';
import { FeaturesPageHero } from './FeaturesPageHero';
import { FeaturesPageSeoContent } from './FeaturesPageSeoContent';
import { Footer } from './Footer';
import { MarketingNavigation } from './MarketingNavigation';

export const FeaturesPage: React.FC = () => {
  return (
    <div className="min-h-screen bg-[var(--dashboard-bg)] flex flex-col">
      <MarketingNavigation />
      <div className="h-16 sm:h-20 shrink-0" aria-hidden />
      <div className="h-4 sm:h-6 shrink-0" aria-hidden />

      <main
        id="main-content"
        className="flex-1 max-w-4xl mx-auto w-full px-4 sm:px-6 py-8 sm:py-12 md:py-16 pb-14 sm:pb-20"
      >
        <FeaturesPageHero />
        <FeaturesPageSeoContent />
        <FeaturesPageCarousel />
        <FeaturesPageCta />
        <FeaturesPageFaq />
      </main>

      <Footer />
    </div>
  );
};
