import { Logo } from '@/components/shared';
import Link from 'next/link';

export default function PrivacyPage() {
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
          Privacy Policy
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
              1. Information We Collect
            </h2>
            <p className="text-base leading-relaxed mb-4">
              We collect information you provide directly and information
              generated through use of ServiceLink.
            </p>
            <ul className="list-disc list-inside space-y-2 ml-4">
              <li>
                Account and profile data (name, email, business name, business
                details, service offerings, pricing, and availability)
              </li>
              <li>
                Booking form data submitted by customers (name, email, phone
                number, address, appointment preferences, and service notes)
              </li>
              <li>
                Content uploads (logos, images, service descriptions, and other
                profile content)
              </li>
              <li>
                Billing and subscription data related to plan purchases and
                renewals
              </li>
              <li>
                Usage and device data (logs, browser information, and platform
                activity)
              </li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl sm:text-2xl font-bold text-white mb-4">
              2. How We Use Information
            </h2>
            <p className="text-base leading-relaxed mb-4">
              We use personal information to operate and improve ServiceLink,
              including to:
            </p>
            <ul className="list-disc list-inside space-y-2 ml-4">
              <li>Create and manage business owner accounts and profiles</li>
              <li>Deliver booking requests and notifications</li>
              <li>
                Process subscriptions, payments, and billing communications
              </li>
              <li>Provide customer support and service communications</li>
              <li>
                Detect abuse, fraud, unauthorized activity, and policy
                violations
              </li>
              <li>
                Send product updates and promotional emails where permitted
              </li>
            </ul>
            <p className="text-base leading-relaxed mt-4">
              You can opt out of marketing emails using the unsubscribe link. We
              may still send transactional or service-related communications.
            </p>
          </section>

          <section>
            <h2 className="text-xl sm:text-2xl font-bold text-white mb-4">
              3. Booking Data and Business Owners
            </h2>
            <p className="text-base leading-relaxed">
              When customers submit booking information, that information is
              shared with the selected business owner so they can communicate
              with the customer and complete the requested service. Business
              owners are responsible for their own use of customer data and must
              comply with applicable privacy and consumer protection laws.
            </p>
          </section>

          <section>
            <h2 className="text-xl sm:text-2xl font-bold text-white mb-4">
              4. Payments and Stripe
            </h2>
            <p className="text-base leading-relaxed">
              Subscription payments are processed by Stripe. We do not store
              full payment card numbers on our servers. Stripe processes
              payment-related information in accordance with its own terms and
              privacy policy.
            </p>
            <p className="text-base leading-relaxed mt-4">
              If you delete your ServiceLink account, we remove your platform
              account and associated profile data from our systems as described
              in our retention practices. Stripe and other payment processors
              may retain certain billing and transaction records for their own
              compliance, fraud prevention, and legal obligations; that
              retention is governed by the processor&apos;s policies, not ours.
            </p>
          </section>

          <section>
            <h2 className="text-xl sm:text-2xl font-bold text-white mb-4">
              5. Sharing and Disclosure
            </h2>
            <p className="text-base leading-relaxed mb-4">
              We do not sell personal information. We may share information:
            </p>
            <ul className="list-disc list-inside space-y-2 ml-4">
              <li>With service providers that help run the platform</li>
              <li>
                With payment processors and infrastructure partners, including
                Stripe
              </li>
              <li>
                With business owners when customers submit booking requests to
                them
              </li>
              <li>To comply with legal obligations or enforce our rights</li>
              <li>
                In connection with a merger, acquisition, financing, or sale of
                assets
              </li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl sm:text-2xl font-bold text-white mb-4">
              6. Data Retention
            </h2>
            <p className="text-base leading-relaxed">
              We retain personal information for as long as needed to provide
              the platform, comply with legal obligations, resolve disputes, and
              enforce agreements. Retention periods vary based on the type of
              data and legal requirements.
            </p>
            <p className="text-base leading-relaxed mt-4">
              When you choose to delete your account through the ServiceLink app
              or website (for example, from account settings), we process that
              request without an artificial waiting period: your access ends and
              we remove your account and associated data from our systems in
              line with this policy and our technical capabilities. There is no
              fixed &quot;grace period&quot; before deletion unless we are
              required to delay or retain specific information by law. Some
              information may still exist where another party holds it (for
              example, a customer who received a booking from you, or billing
              records held by Stripe) as described elsewhere in this policy.
            </p>
          </section>

          <section>
            <h2 className="text-xl sm:text-2xl font-bold text-white mb-4">
              7. Data Security
            </h2>
            <p className="text-base leading-relaxed">
              We use reasonable technical and organizational safeguards to
              protect personal information. No method of transmission or storage
              is completely secure, and we cannot guarantee absolute security.
            </p>
          </section>

          <section>
            <h2 className="text-xl sm:text-2xl font-bold text-white mb-4">
              8. Your Privacy Rights
            </h2>
            <p className="text-base leading-relaxed mb-4">
              Depending on your location, you may have rights to access,
              correct, delete, or object to certain processing of your personal
              information.
            </p>
            <ul className="list-disc list-inside space-y-2 ml-4">
              <li>Request access to or a copy of your personal information</li>
              <li>Request correction of inaccurate information</li>
              <li>Request deletion, subject to legal exceptions</li>
              <li>
                Delete your account directly in ServiceLink (web or mobile app),
                which removes your account and associated platform data when the
                request succeeds; billing-related records may still be retained
                by payment processors as noted above
              </li>
              <li>Request limits on certain processing activities</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl sm:text-2xl font-bold text-white mb-4">
              9. Cookies and Similar Technologies
            </h2>
            <p className="text-base leading-relaxed">
              We may use cookies and similar technologies for authentication,
              preferences, analytics, and platform functionality. You can
              control cookies through browser settings, though some features may
              not work properly if cookies are disabled.
            </p>
          </section>

          <section>
            <h2 className="text-xl sm:text-2xl font-bold text-white mb-4">
              10. Children&apos;s Privacy
            </h2>
            <p className="text-base leading-relaxed">
              ServiceLink is not intended for children under 13, and we do not
              knowingly collect personal information from children under 13.
            </p>
          </section>

          <section>
            <h2 className="text-xl sm:text-2xl font-bold text-white mb-4">
              11. Changes to This Privacy Policy
            </h2>
            <p className="text-base leading-relaxed">
              We may update this Privacy Policy from time to time. We will post
              the updated version on this page and revise the &quot;Last
              updated&quot; date.
            </p>
          </section>

          <section>
            <h2 className="text-xl sm:text-2xl font-bold text-white mb-4">
              12. Contact Us
            </h2>
            <p className="text-base leading-relaxed">
              If you have any questions about this Privacy Policy, please
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
