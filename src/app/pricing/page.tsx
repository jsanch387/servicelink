import { Navigation } from '@/features/landing-page/components/Navigation';
import {
  PLANS,
  PricingComparisonTable,
  PublicPricingPlans,
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
          Get started on {free.name} with your booking page, scheduling, and
          core tools — no credit card required. Upgrade to {pro.name} when you
          want unlimited bookings, payments on your iPhone at the job, quotes,
          and more. Pay monthly or save two months with yearly billing.
        </p>

        <PublicPricingPlans className="max-w-4xl mx-auto" />

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
