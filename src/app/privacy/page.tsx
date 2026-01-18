import { Logo } from '@/components/shared';
import Link from 'next/link';
import React from 'react';

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
            Last updated: {new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
          </p>

          <section>
            <h2 className="text-xl sm:text-2xl font-bold text-white mb-4">1. Information We Collect</h2>
            <p className="text-base leading-relaxed mb-4">
              We collect information that you provide directly to us, including:
            </p>
            <ul className="list-disc list-inside space-y-2 ml-4">
              <li>Account information (name, email address, business name)</li>
              <li>Profile information (business type, service area, contact information)</li>
              <li>Content you upload (logos, cover photos, service listings, portfolio images)</li>
              <li>Payment information (processed securely through third-party providers)</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl sm:text-2xl font-bold text-white mb-4">2. How We Use Your Information</h2>
            <p className="text-base leading-relaxed mb-4">We use the information we collect to:</p>
            <ul className="list-disc list-inside space-y-2 ml-4">
              <li>Provide, maintain, and improve our services</li>
              <li>Create and manage your account and profile</li>
              <li>Process transactions and send related information</li>
              <li>Send technical notices, updates, and support messages</li>
              <li>Send marketing communications, product information, and promotional emails</li>
              <li>Respond to your comments and questions</li>
            </ul>
            <p className="text-base leading-relaxed mt-4">
              By signing up for an account, you consent to receive email communications from us, including but not limited to account updates, product announcements, service information, and promotional content. You may opt-out of promotional emails at any time by clicking the unsubscribe link in any email or by contacting us directly.
            </p>
          </section>

          <section>
            <h2 className="text-xl sm:text-2xl font-bold text-white mb-4">3. Information Sharing and Disclosure</h2>
            <p className="text-base leading-relaxed">
              We do not sell, trade, or rent your personal information to third parties. We may share your information only in the following circumstances:
            </p>
            <ul className="list-disc list-inside space-y-2 ml-4 mt-4">
              <li>With your consent</li>
              <li>To comply with legal obligations</li>
              <li>To protect and defend our rights or property</li>
              <li>With service providers who assist us in operating our platform</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl sm:text-2xl font-bold text-white mb-4">4. Data Security</h2>
            <p className="text-base leading-relaxed">
              We implement appropriate technical and organizational measures to protect your personal information. However, no method of transmission over the Internet or electronic storage is 100% secure.
            </p>
          </section>

          <section>
            <h2 className="text-xl sm:text-2xl font-bold text-white mb-4">5. Your Rights</h2>
            <p className="text-base leading-relaxed mb-4">You have the right to:</p>
            <ul className="list-disc list-inside space-y-2 ml-4">
              <li>Access and receive a copy of your personal data</li>
              <li>Rectify inaccurate or incomplete data</li>
              <li>Request deletion of your personal data</li>
              <li>Object to or restrict processing of your personal data</li>
              <li>Data portability</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl sm:text-2xl font-bold text-white mb-4">6. Cookies and Tracking Technologies</h2>
            <p className="text-base leading-relaxed">
              We use cookies and similar tracking technologies to track activity on our service and hold certain information. You can instruct your browser to refuse all cookies or to indicate when a cookie is being sent.
            </p>
          </section>

          <section>
            <h2 className="text-xl sm:text-2xl font-bold text-white mb-4">7. Changes to This Privacy Policy</h2>
            <p className="text-base leading-relaxed">
              We may update our Privacy Policy from time to time. We will notify you of any changes by posting the new Privacy Policy on this page and updating the &quot;Last updated&quot; date.
            </p>
          </section>

          <section>
            <h2 className="text-xl sm:text-2xl font-bold text-white mb-4">8. Contact Us</h2>
            <p className="text-base leading-relaxed">
              If you have any questions about this Privacy Policy, please contact us at{' '}
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
