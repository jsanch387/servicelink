import { Button } from '@/components/shared';
import { ROUTES } from '@/constants/routes';
import { Navigation } from '@/features/landing-page/components/Navigation';
import {
  PLANS,
  PricingPlanCard,
  PUBLIC_PRICING_PRO_PLAN_FEATURES,
  type ProFeatureItem,
} from '@/features/pricing';
import Link from 'next/link';

export default function PricingPage() {
  const pro = PLANS.pro;
  const pricingPageFeatures: readonly ProFeatureItem[] =
    PUBLIC_PRICING_PRO_PLAN_FEATURES;

  return (
    <div className="min-h-screen bg-[var(--dashboard-bg)]">
      <Navigation />
      {/* Spacer: matches fixed nav height so content starts below it */}
      <div className="h-16 sm:h-20 shrink-0" aria-hidden />
      {/* Visible gap between nav and content */}
      <div className="h-4 sm:h-6 shrink-0" aria-hidden />
      <main className="max-w-6xl mx-auto px-4 sm:px-6 py-8 sm:py-12 md:py-16">
        <h1 className="text-3xl sm:text-4xl md:text-5xl font-extrabold t Startext-white mb-4 tracking-tight text-center">
          pricing
        </h1>
        <p className="text-gray-400 text-center mb-12 sm:mb-16 max-w-2xl mx-auto text-sm sm:text-base">
          Grow faster with one simple plan built for service businesses. Start
          your 7-day free trial, then continue at $10/month.
        </p>

        <div className="max-w-xl mx-auto">
          <PricingPlanCard
            variant="pro"
            title={pro.name}
            description={pro.description}
            price={pro.price}
            features={pricingPageFeatures}
            footer={
              <Button
                href={ROUTES.AUTH.SIGNUP}
                variant="inverse"
                className="w-full"
              >
                Start 7-day free trial
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
              <p className="text-sm font-medium text-white">7-day free trial</p>
              <p className="text-xs text-gray-400 mt-1">
                Launch your profile and test everything befo re your first
                charge.
              </p>
            </div>
            <div className="rounded-xl border border-white/10 bg-white/[0.03] p-4">
              <p className="text-sm font-medium text-white">
                $10/month after trial
              </p>
              <p className="text-xs text-gray-400 mt-1">
                Keep bookings, payments, and customer management in one place.
              </p>
            </div>
            <div className="rounded-xl border border-white/10 bg-white/[0.03] p-4">
              <p className="text-sm font-medium text-white">
                Built to help you book more
              </p>
              <p className="text-xs text-gray-400 mt-1">
                A stronger profile and smoother workflow helps convert more
                leads.
              </p>
            </div>
            <div className="rounded-xl border border-white/10 bg-white/[0.03] p-4">
              <p className="text-sm font-medium text-white">Cancel anytime</p>
              <p className="text-xs text-gray-400 mt-1">
                Stay because it works, not because of a contract.
              </p>
            </div>
          </div>
        </section>
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
