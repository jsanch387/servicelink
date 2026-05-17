import { Button } from '@/components/shared';
import { ROUTES } from '@/constants/routes';
import { Navigation } from '@/features/landing-page/components/Navigation';
import {
  FREE_BOOKINGS_LIMIT,
  PLANS,
  PUBLIC_PRICING_FREE_PLAN_FEATURES,
  PUBLIC_PRICING_PRO_PLAN_FEATURES,
  PricingPlanCard,
} from '@/features/pricing';
import Link from 'next/link';

export default function PricingPage() {
  const free = PLANS.free;
  const pro = PLANS.pro;

  return (
    <div className="min-h-screen bg-[var(--dashboard-bg)]">
      <Navigation />
      <div className="h-16 sm:h-20 shrink-0" aria-hidden />
      <div className="h-4 sm:h-6 shrink-0" aria-hidden />
      <main className="max-w-6xl mx-auto px-4 sm:px-6 py-8 sm:py-12 md:py-16">
        <h1 className="text-3xl sm:text-4xl md:text-5xl font-extrabold text-white mb-4 tracking-tight text-center">
          Pricing
        </h1>
        <p className="text-gray-400 text-center mb-12 sm:mb-16 max-w-2xl mx-auto text-sm sm:text-base">
          Start on Free with {FREE_BOOKINGS_LIMIT} online bookings and core
          tools. Upgrade to Pro when you need unlimited bookings, payments,
          quotes, and more.
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

        <section className="max-w-4xl mx-auto mt-10 sm:mt-12">
          <h2 className="text-xl sm:text-2xl font-semibold text-white text-center">
            Everything you need to know
          </h2>
          <div className="mt-5 grid gap-3 sm:grid-cols-2">
            <div className="rounded-xl border border-white/10 bg-white/[0.03] p-4">
              <p className="text-sm font-medium text-white">Free plan</p>
              <p className="text-xs text-gray-400 mt-1">
                Includes {FREE_BOOKINGS_LIMIT} online bookings, your booking
                page, CRM, and email alerts—no credit card required.
              </p>
            </div>
            <div className="rounded-xl border border-white/10 bg-white/[0.03] p-4">
              <p className="text-sm font-medium text-white">Pro plan</p>
              <p className="text-xs text-gray-400 mt-1">
                $10/month for unlimited bookings and Pro-only features. Cancel
                anytime from your dashboard.
              </p>
            </div>
            <div className="rounded-xl border border-white/10 bg-white/[0.03] p-4">
              <p className="text-sm font-medium text-white">What Pro unlocks</p>
              <p className="text-xs text-gray-400 mt-1">
                Unlimited bookings, in-app payments, quote requests, multiple
                prices per service, verified badge, and more gallery photos.
              </p>
            </div>
            <div className="rounded-xl border border-white/10 bg-white/[0.03] p-4">
              <p className="text-sm font-medium text-white">Cancel anytime</p>
              <p className="text-xs text-gray-400 mt-1">
                Stay on Free as long as you like, or downgrade from Pro whenever
                you want.
              </p>
            </div>
          </div>
        </section>
      </main>

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
