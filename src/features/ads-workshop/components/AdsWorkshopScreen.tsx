import { Navigation } from '@/features/landing-page/components/Navigation';
import { AdsWorkshopCurriculumSection } from './AdsWorkshopCurriculumSection';
import { AdsWorkshopFlow } from './AdsWorkshopFlow';
import { AdsWorkshopHero } from './AdsWorkshopHero';
import { AdsWorkshopPageFooter } from './AdsWorkshopPageFooter';

/** Dedicated workshop page at `ROUTES.WORKSHOP_RUN_ADS` (linked from landing). */
export function AdsWorkshopScreen() {
  return (
    <div className="min-h-screen bg-[var(--dashboard-bg)] flex flex-col">
      <Navigation />
      <div className="h-16 sm:h-20 shrink-0" aria-hidden />
      <div className="h-4 sm:h-6 shrink-0" aria-hidden />

      <AdsWorkshopHero />

      <main
        id="workshop-access"
        className="max-w-4xl mx-auto w-full px-4 sm:px-6 pb-10 sm:pb-12"
        aria-label="Workshop registration and video"
      >
        <AdsWorkshopFlow />
      </main>

      <AdsWorkshopCurriculumSection />
      <AdsWorkshopPageFooter />
    </div>
  );
}
