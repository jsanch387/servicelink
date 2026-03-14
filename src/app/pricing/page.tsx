import { Button } from '@/components/shared';
import { ROUTES } from '@/constants/routes';
import { Navigation } from '@/features/landing-page/components/Navigation';
import { CheckIcon } from '@heroicons/react/24/solid';
import Link from 'next/link';

const FREE_FEATURES = [
  'Public booking page',
  'Gallery (limited images)',
  'Up to 5 bookings / month',
];

const PRO_FEATURES = [
  'Unlimited bookings',
  'More gallery images',
  'Priority support',
  'Future features',
];

function FeatureList({ items }: { items: string[] }) {
  return (
    <ul className="space-y-3">
      {items.map(text => (
        <li
          key={text}
          className="flex items-center gap-3 text-gray-300 text-sm sm:text-base"
        >
          <CheckIcon className="h-5 w-5 shrink-0 text-green-500" aria-hidden />
          <span>{text}</span>
        </li>
      ))}
    </ul>
  );
}

export default function PricingPage() {
  return (
    <div className="min-h-screen bg-[var(--dashboard-bg)]">
      <Navigation />
      {/* Spacer: matches fixed nav height so content starts below it */}
      <div className="h-16 sm:h-20 shrink-0" aria-hidden />
      {/* Visible gap between nav and content */}
      <div className="h-12 sm:h-16 shrink-0" aria-hidden />
      <main className="max-w-5xl mx-auto px-4 sm:px-6 py-12 sm:py-16 md:py-20">
        <h1 className="text-3xl sm:text-4xl md:text-5xl font-extrabold text-white mb-4 tracking-tight text-center">
          Pricing
        </h1>
        <p className="text-gray-400 text-center mb-12 sm:mb-16 max-w-xl mx-auto">
          Start free, upgrade when you need more. No credit card required.
        </p>

        <div className="grid sm:grid-cols-2 gap-6 lg:gap-8 max-w-4xl mx-auto items-stretch">
          {/* Free tier */}
          <div className="rounded-2xl border border-white/10 bg-white/5 backdrop-blur-sm p-6 sm:p-8 flex flex-col h-full">
            <h2 className="text-xl font-bold text-white mb-1">Free</h2>
            <p className="text-gray-400 text-sm mb-6">
              Perfect for new businesses and side hustles testing the waters.
            </p>
            <div className="mb-6">
              <span className="text-4xl font-extrabold text-white">$0</span>
              <span className="text-gray-400 ml-1">/month</span>
            </div>
            <FeatureList items={FREE_FEATURES} />
            <div className="min-h-12 flex-1" aria-hidden />
            <div className="pt-6 border-t border-white/10">
              <Button
                href={ROUTES.AUTH.SIGNUP}
                variant="secondary"
                className="w-full"
              >
                Get started
              </Button>
            </div>
          </div>

          {/* Pro tier */}
          <div className="rounded-2xl border border-white/10 bg-white/5 backdrop-blur-sm p-6 sm:p-8 flex flex-col h-full relative overflow-hidden">
            <div className="absolute top-0 right-0 bg-white text-neutral-900 text-[10px] sm:text-xs font-semibold uppercase tracking-wider px-3 py-1.5 rounded-bl-xl">
              Most popular
            </div>
            <h2 className="text-xl font-bold text-white mb-1">Pro</h2>
            <p className="text-gray-400 text-sm mb-6">
              For busy pros who need unlimited bookings and full control.
            </p>
            <div className="mb-6">
              <span className="text-4xl font-extrabold text-white">$10</span>
              <span className="text-gray-400 ml-1">/month</span>
            </div>
            <FeatureList items={PRO_FEATURES} />
            <div className="min-h-12 flex-1" aria-hidden />
            <div className="pt-6 border-t border-white/10">
              <Button
                href={ROUTES.AUTH.SIGNUP}
                variant="inverse"
                className="w-full"
              >
                Get Pro
              </Button>
            </div>
          </div>
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
