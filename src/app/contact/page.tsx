import { ContactForm } from '@/features/contact';
import { MarketingNavigation } from '@/features/landing-page/components/MarketingNavigation';
import { ROUTES } from '@/constants/routes';
import {
  SERVICELINK_SUPPORT_EMAIL,
  SERVICELINK_SUPPORT_MAILTO,
} from '@/constants/support';
import Link from 'next/link';

export default function ContactPage() {
  return (
    <div className="flex min-h-screen flex-col bg-[var(--dashboard-bg)]">
      <MarketingNavigation />
      <div className="h-16 shrink-0 sm:h-20 lg:h-24" aria-hidden />
      <div className="h-4 shrink-0 sm:h-6" aria-hidden />
      <main className="mx-auto flex w-full max-w-6xl flex-1 flex-col px-4 py-8 sm:px-6 sm:py-12 md:py-16">
        <h1 className="mb-4 text-center text-3xl font-extrabold tracking-tight text-white sm:mb-6 sm:text-4xl md:text-5xl">
          Contact Us
        </h1>
        <p className="mx-auto mb-12 max-w-2xl text-center text-sm text-gray-400 sm:mb-16 sm:text-base">
          Request a feature, report a bug, or ask us anything. We typically
          reply within 24 hours.
        </p>

        <div className="mx-auto flex w-full max-w-2xl flex-1 flex-col">
          <ContactForm />

          <div className="mt-auto space-y-4 pt-10 text-center sm:pt-16">
            <p className="text-sm text-gray-500">
              Prefer email?{' '}
              <a
                href={SERVICELINK_SUPPORT_MAILTO}
                className="cursor-pointer text-white/80 underline transition-colors hover:text-white"
              >
                {SERVICELINK_SUPPORT_EMAIL}
              </a>
            </p>

            <p className="text-sm text-gray-500">
              See also{' '}
              <Link
                href={ROUTES.PRIVACY}
                className="cursor-pointer text-white/80 underline transition-colors hover:text-white"
              >
                Privacy Policy
              </Link>{' '}
              and{' '}
              <Link
                href={ROUTES.TERMS}
                className="cursor-pointer text-white/80 underline transition-colors hover:text-white"
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
