import { Logo } from '@/components/shared';
import Link from 'next/link';

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-neutral-900">
      {/* Header */}
      <header className="border-b border-white/10 bg-neutral-900/50 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 sm:h-20 flex items-center justify-between">
          <Link href="/" className="flex items-center">
            <Logo size="md" variant="full" />
          </Link>
        </div>
      </header>

      {/* Content */}
      <main className="max-w-4xl mx-auto px-4 sm:px-6 py-12 sm:py-16 md:py-20">
        <h1 className="text-3xl sm:text-4xl md:text-5xl font-extrabold text-white mb-8 sm:mb-10 tracking-tight">
          Terms of Service
        </h1>

        <div className="prose prose-invert max-w-none space-y-6 text-gray-400">
          <p className="text-sm text-gray-500 mb-8">
            Last updated:{' '}
            {new Date().toLocaleDateString('en-US', {
              year: 'numeric',
              month: 'long',
              day: 'numeric',
            })}
          </p>

          <section>
            <h2 className="text-xl sm:text-2xl font-bold text-white mb-4">
              1. Acceptance of Terms
            </h2>
            <p className="text-base leading-relaxed">
              By accessing or using ServiceLink, you agree to these Terms of
              Service. If you do not agree, please do not use the platform.
            </p>
          </section>

          <section>
            <h2 className="text-xl sm:text-2xl font-bold text-white mb-4">
              2. Platform Overview
            </h2>
            <p className="text-base leading-relaxed mb-4">
              ServiceLink helps business owners create a public booking page,
              list services, accept booking requests, and receive customer
              details needed to complete jobs.
            </p>
            <ul className="list-disc list-inside space-y-2 ml-4">
              <li>
                Business owners create and manage service profiles, pricing, and
                availability.
              </li>
              <li>Customers can submit booking forms and request services.</li>
              <li>
                ServiceLink may send booking-related and account-related email
                notifications.
              </li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl sm:text-2xl font-bold text-white mb-4">
              3. Accounts and Eligibility
            </h2>
            <p className="text-base leading-relaxed mb-4">
              To use certain features, you must create an account and provide
              accurate, complete, and current information.
            </p>
            <ul className="list-disc list-inside space-y-2 ml-4">
              <li>
                You are responsible for safeguarding your account credentials.
              </li>
              <li>You are responsible for all activity under your account.</li>
              <li>
                You agree to update account information as needed to keep it
                accurate.
              </li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl sm:text-2xl font-bold text-white mb-4">
              4. Customer Booking Data
            </h2>
            <p className="text-base leading-relaxed mb-4">
              Customers may provide personal information in booking forms,
              including name, email, phone number, address, and service details.
            </p>
            <ul className="list-disc list-inside space-y-2 ml-4">
              <li>
                Business owners are responsible for how they use customer data
                received through bookings.
              </li>
              <li>
                Business owners must comply with applicable privacy and consumer
                protection laws.
              </li>
              <li>
                You may not misuse booking data, including spam or unauthorized
                marketing.
              </li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl sm:text-2xl font-bold text-white mb-4">
              5. Content and Business Information
            </h2>
            <p className="text-base leading-relaxed">
              You are responsible for all content you upload or publish,
              including service descriptions, pricing, contact details, and
              images. You represent that you have the rights to use and share
              that content.
            </p>
          </section>

          <section>
            <h2 className="text-xl sm:text-2xl font-bold text-white mb-4">
              6. Paid Plans, Billing, and Stripe
            </h2>
            <p className="text-base leading-relaxed mb-4">
              ServiceLink offers paid subscriptions, including a Pro plan.
              Subscription charges are processed securely by Stripe.
            </p>
            <ul className="list-disc list-inside space-y-2 ml-4">
              <li>
                By subscribing, you authorize recurring charges at the rate
                shown during checkout.
              </li>
              <li>
                You are responsible for maintaining a valid payment method.
              </li>
              <li>
                Renewal timing, upgrades, cancellations, and billing are handled
                through Stripe-powered checkout and billing tools.
              </li>
              <li>
                Unless otherwise stated, fees are non-refundable except where
                required by law.
              </li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl sm:text-2xl font-bold text-white mb-4">
              7. Prohibited Uses
            </h2>
            <p className="text-base leading-relaxed mb-4">
              You may not use ServiceLink to:
            </p>
            <ul className="list-disc list-inside space-y-2 ml-4">
              <li>Violate applicable laws or regulations</li>
              <li>Upload deceptive, unlawful, or infringing content</li>
              <li>Attempt unauthorized access to data, systems, or accounts</li>
              <li>Disrupt, damage, or impair platform performance</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl sm:text-2xl font-bold text-white mb-4">
              8. Termination
            </h2>
            <p className="text-base leading-relaxed">
              We may suspend or terminate accounts for violations of these
              Terms, fraudulent activity, payment failures, or behavior that
              creates legal, security, or operational risk.
            </p>
          </section>

          <section>
            <h2 className="text-xl sm:text-2xl font-bold text-white mb-4">
              9. Disclaimers and Limitation of Liability
            </h2>
            <p className="text-base leading-relaxed">
              ServiceLink is provided on an &quot;as is&quot; and &quot;as
              available&quot; basis. To the fullest extent permitted by law, we
              disclaim all warranties and are not liable for indirect,
              incidental, special, consequential, or punitive damages, including
              lost profits, lost data, and business interruption.
            </p>
          </section>

          <section>
            <h2 className="text-xl sm:text-2xl font-bold text-white mb-4">
              10. Changes to These Terms
            </h2>
            <p className="text-base leading-relaxed">
              We may update these Terms from time to time. Updated versions will
              be posted on this page with a revised &quot;Last updated&quot;
              date. Continued use of ServiceLink after updates means you accept
              the updated Terms.
            </p>
          </section>

          <section>
            <h2 className="text-xl sm:text-2xl font-bold text-white mb-4">
              11. Contact Us
            </h2>
            <p className="text-base leading-relaxed">
              If you have any questions about these Terms of Service, please
              contact us at{' '}
              <a
                href="mailto:app.servicelink@gmail.com"
                className="text-orange-400 hover:text-orange-300 underline"
              >
                app.servicelink@gmail.com
              </a>
              .
            </p>
          </section>
        </div>
      </main>

      {/* Footer */}
      <footer className="mt-16 sm:mt-20 py-8 px-4 border-t border-white/5 text-center">
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
