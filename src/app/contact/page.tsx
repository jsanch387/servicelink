import { ContactForm } from '@/features/contact';
import { MarketingBackButton } from '@/features/landing-page/components/MarketingBackButton';
import { Navigation } from '@/features/landing-page/components/Navigation';
import { ROUTES } from '@/constants/routes';
import {
  SERVICELINK_SUPPORT_EMAIL,
  SERVICELINK_SUPPORT_MAILTO,
} from '@/constants/support';
import Link from 'next/link';

export default function ContactPage() {
  return (
    <div className="min-h-screen bg-[var(--dashboard-bg)] flex flex-col">
      <Navigation />
      <div className="h-16 sm:h-20 shrink-0" aria-hidden />
      <div className="h-4 sm:h-6 shrink-0" aria-hidden />
      <main className="flex-1 flex flex-col max-w-6xl mx-auto w-full px-4 sm:px-6 py-8 sm:py-12 md:py-16 pb-8 sm:pb-12">
        <div className="relative flex items-center justify-center mb-4 sm:mb-6 min-h-[44px]">
          <div className="absolute left-0 top-1/2 -translate-y-1/2">
            <MarketingBackButton className="ml-0" />
          </div>
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-extrabold text-white tracking-tight text-center px-12 sm:px-14">
            Contact Us
          </h1>
        </div>
        <p className="text-gray-400 text-center mb-12 sm:mb-16 max-w-2xl mx-auto text-sm sm:text-base">
          Request a feature, report a bug, or ask us anything. We typically
          reply within 24 hours.
        </p>

        <div className="max-w-2xl mx-auto w-full flex-1 flex flex-col">
          <ContactForm />

          <div className="mt-auto pt-10 sm:pt-16 space-y-4 text-center">
            <p className="text-sm text-gray-500">
              Prefer email?{' '}
              <a
                href={SERVICELINK_SUPPORT_MAILTO}
                className="text-white/80 hover:text-white underline transition-colors"
              >
                {SERVICELINK_SUPPORT_EMAIL}
              </a>
            </p>

            <p className="text-sm text-gray-500">
              See also{' '}
              <Link
                href={ROUTES.PRIVACY}
                className="text-white/80 hover:text-white underline transition-colors"
              >
                Privacy Policy
              </Link>{' '}
              and{' '}
              <Link
                href={ROUTES.TERMS}
                className="text-white/80 hover:text-white underline transition-colors"
              >
                Terms of Service
              </Link>
              .
            </p>
          </div>
        </div>
      </main>
    </div>
  );
}
