import { Button } from '@/components/shared';
import { ROUTES } from '@/constants/routes';
import { Navigation } from '@/features/landing-page/components/Navigation';
import {
  MARKETING_FREE_PLAN_FEATURES,
  MARKETING_PRO_PLAN_FEATURES,
  PLANS,
  PricingPlanCard,
} from '@/features/pricing';
import Link from 'next/link';

export default function PricingPage() {
  const free = PLANS.free;
  const pro = PLANS.pro;

  return (
    <div className="min-h-screen bg-[var(--dashboard-bg)]">
      <Navigation />
      {/* Spacer: matches fixed nav height so content starts below it */}
      <div className="h-16 sm:h-20 shrink-0" aria-hidden />
      {/* Visible gap between nav and content */}
      <div className="h-12 sm:h-16 shrink-0" aria-hidden />
      <main className="max-w-6xl mx-auto px-4 sm:px-6 py-12 sm:py-16 md:py-20">
        <h1 className="text-3xl sm:text-4xl md:text-5xl font-extrabold text-white mb-4 tracking-tight text-center">
          Pricing
        </h1>
        <p className="text-gray-400 text-center mb-12 sm:mb-16 max-w-2xl mx-auto text-sm sm:text-base">
          Start free, upgrade when you need more. No credit card required.
        </p>

        <div className="grid sm:grid-cols-2 gap-6 lg:gap-8 max-w-5xl mx-auto items-stretch">
          <PricingPlanCard
            variant="free"
            title={free.name}
            description={free.description}
            price={free.price}
            features={MARKETING_FREE_PLAN_FEATURES}
            emphasizeFeatureHighlights={false}
            footer={
              <Button
                href={ROUTES.AUTH.SIGNUP}
                variant="secondary"
                className="w-full"
              >
                Get started
              </Button>
            }
          />
          <PricingPlanCard
            variant="pro"
            title={pro.name}
            description={pro.description}
            price={pro.price}
            features={MARKETING_PRO_PLAN_FEATURES}
            badgeLabel="Most popular"
            footer={
              <Button
                href={ROUTES.AUTH.SIGNUP}
                variant="inverse"
                className="w-full"
              >
                Get Pro
              </Button>
            }
          />
        </div>
      </main>

      {/* Footer */}
      <footer className="mt-16 sm:mt-20 py-8 px-4 border-t border-[var(--dashboard-border)] text-center">
        <Link
          href="/"
          className="text-sm text-gray-500 hover:text-white transition-colors"
        >
          ← Back to Home
        </Link>
      </footer>
    </div>
  );
}
