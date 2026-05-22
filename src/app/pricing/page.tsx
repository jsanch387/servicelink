import { Button } from '@/components/shared';
import { ROUTES } from '@/constants/routes';
import { Navigation } from '@/features/landing-page/components/Navigation';
import {
  FREE_BOOKINGS_LIMIT,
  PLANS,
  PUBLIC_PRICING_FREE_PLAN_FEATURES,
  PUBLIC_PRICING_PRO_PLAN_FEATURES,
  PricingComparisonTable,
  PricingPlanCard,
} from '@/features/pricing';

export default function PricingPage() {
  const free = PLANS.free;
  const pro = PLANS.pro;

  return (
    <div className="min-h-screen bg-[var(--dashboard-bg)]">
      <Navigation />
      <div className="h-16 sm:h-20 shrink-0" aria-hidden />
      <div className="h-4 sm:h-6 shrink-0" aria-hidden />
      <main className="max-w-6xl mx-auto px-4 sm:px-6 py-8 sm:py-12 md:py-16">
        <h1 className="text-3xl sm:text-4xl md:text-5xl font-extrabold text-white tracking-tight text-center mb-4 sm:mb-6">
          Pricing
        </h1>
        <p className="text-gray-400 text-center mb-12 sm:mb-16 max-w-2xl mx-auto text-sm sm:text-base">
          Start on {free.name} with {FREE_BOOKINGS_LIMIT} online bookings and
          core tools. Upgrade to {pro.name} when you need unlimited bookings,
          payments, quotes, and more.
        </p>

        <div className="grid gap-6 md:grid-cols-2 max-w-4xl mx-auto items-stretch">
          <PricingPlanCard
            variant="free"
            title={free.name}
            description={free.description}
            price={free.price}
            priceSuffix=" forever"
            features={PUBLIC_PRICING_FREE_PLAN_FEATURES}
            emphasizeFeatureHighlights
            footer={
              <Button
                href={ROUTES.AUTH.SIGNUP}
                variant="secondary"
                className="w-full"
              >
                Get started free
              </Button>
            }
          />
          <PricingPlanCard
            variant="pro"
            title={pro.name}
            description={pro.description}
            price={pro.price}
            features={PUBLIC_PRICING_PRO_PLAN_FEATURES}
            badgeLabel="Most popular"
            className="md:relative md:z-10"
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

        <section className="max-w-4xl mx-auto mt-12 sm:mt-16">
          <h2 className="text-xl sm:text-2xl font-semibold text-white text-center mb-6 sm:mb-8">
            Compare plans
          </h2>
          <PricingComparisonTable />
          <p className="mt-6 text-center text-xs text-zinc-500">
            No credit card required for {free.name}. Cancel {pro.name} anytime
            from your dashboard.
          </p>
        </section>
      </main>
    </div>
  );
}
