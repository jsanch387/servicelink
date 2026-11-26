import { MarketingGalaxyBackground } from '@/components/shared';
import { MarketingFooter } from '@/features/landing-page/components/MarketingFooter';
import { MarketingNavigation } from '@/features/landing-page/components/MarketingNavigation';
import type { IndustryLandingContent } from '../types';
import { IndustryComparisonStrip } from './IndustryComparisonStrip';
import { IndustryFaqCta } from './IndustryFaqCta';
import { IndustryFeatureTiles } from './IndustryFeatureTiles';
import { IndustryHero } from './IndustryHero';
import { IndustryHowItWorks } from './IndustryHowItWorks';
import { IndustryMobileOrShop } from './IndustryMobileOrShop';

export function IndustryLandingPage({
  content,
}: {
  content: IndustryLandingContent;
}) {
  return (
    <div className="relative flex min-h-screen flex-col overflow-x-hidden bg-[var(--dashboard-bg)]">
      <MarketingGalaxyBackground />
      <div className="relative z-10 flex min-h-screen flex-col">
        <MarketingNavigation />
        <div className="h-16 shrink-0 sm:h-20 lg:h-24" aria-hidden />
        <main className="flex-1">
          <IndustryHero content={content} />
          <IndustryHowItWorks content={content} />
          <IndustryFeatureTiles content={content} />
          <IndustryMobileOrShop content={content} />
          <IndustryComparisonStrip content={content} />
          <IndustryFaqCta content={content} />
        </main>
        <MarketingFooter />
      </div>
    </div>
  );
}
