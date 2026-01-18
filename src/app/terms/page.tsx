import { Logo } from '@/components/shared';
import Link from 'next/link';
import React from 'react';

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
            Last updated: {new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
          </p>

          <section>
            <h2 className="text-xl sm:text-2xl font-bold text-white mb-4">1. Acceptance of Terms</h2>
            <p className="text-base leading-relaxed">
              By accessing and using Service Link, you accept and agree to be bound by the terms and provision of this agreement.
            </p>
          </section>

          <section>
            <h2 className="text-xl sm:text-2xl font-bold text-white mb-4">2. Use License</h2>
            <p className="text-base leading-relaxed mb-4">
              Permission is granted to temporarily use Service Link for personal, non-commercial use. This is the grant of a license, not a transfer of title, and under this license you may not:
            </p>
            <ul className="list-disc list-inside space-y-2 ml-4">
              <li>modify or copy the materials</li>
              <li>use the materials for any commercial purpose or for any public display</li>
              <li>attempt to decompile or reverse engineer any software contained on Service Link</li>
              <li>remove any copyright or other proprietary notations from the materials</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl sm:text-2xl font-bold text-white mb-4">3. User Accounts</h2>
            <p className="text-base leading-relaxed">
              When you create an account with us, you must provide information that is accurate, complete, and current at all times. You are responsible for safeguarding the password and for all activities that occur under your account.
            </p>
          </section>

          <section>
            <h2 className="text-xl sm:text-2xl font-bold text-white mb-4">4. Content</h2>
            <p className="text-base leading-relaxed">
              Our Service allows you to post, link, store, share and otherwise make available certain information, text, graphics, or other material. You are responsible for the content that you post on or through the Service.
            </p>
          </section>

          <section>
            <h2 className="text-xl sm:text-2xl font-bold text-white mb-4">5. Prohibited Uses</h2>
            <p className="text-base leading-relaxed mb-4">You may not use our Service:</p>
            <ul className="list-disc list-inside space-y-2 ml-4">
              <li>In any way that violates any applicable national or international law or regulation</li>
              <li>To transmit, or procure the sending of, any advertising or promotional material</li>
              <li>To impersonate or attempt to impersonate the company, a company employee, another user, or any other person or entity</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl sm:text-2xl font-bold text-white mb-4">6. Termination</h2>
            <p className="text-base leading-relaxed">
              We may terminate or suspend your account and bar access to the Service immediately, without prior notice or liability, under our sole discretion, for any reason whatsoever and without limitation.
            </p>
          </section>

          <section>
            <h2 className="text-xl sm:text-2xl font-bold text-white mb-4">7. Limitation of Liability</h2>
            <p className="text-base leading-relaxed">
              In no event shall Service Link, nor its directors, employees, partners, agents, suppliers, or affiliates, be liable for any indirect, incidental, special, consequential, or punitive damages.
            </p>
          </section>

          <section>
            <h2 className="text-xl sm:text-2xl font-bold text-white mb-4">8. Contact Us</h2>
            <p className="text-base leading-relaxed">
              If you have any questions about these Terms of Service, please contact us at{' '}
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
