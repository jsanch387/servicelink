import { MarketingGalaxyBackground } from '@/components/shared';
import { Footer } from '@/features/landing-page/components/Footer';
import { Navigation } from '@/features/landing-page/components/Navigation';

import { ResourcesIndexScreen } from './ResourcesIndexScreen';

export function ResourcesPageShell() {
  return (
    <div className="min-h-screen bg-[var(--dashboard-bg)] relative overflow-x-hidden">
      <MarketingGalaxyBackground showStreaks={false} />
      <div className="relative z-10 flex min-h-screen flex-col">
        <Navigation />
        <div className="h-16 sm:h-20 shrink-0" aria-hidden />
        <div className="h-4 sm:h-6 shrink-0" aria-hidden />
        <div className="flex-1">
          <ResourcesIndexScreen />
        </div>
        <Footer />
      </div>
    </div>
  );
}
