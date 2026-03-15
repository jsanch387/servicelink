import { Logo } from '@/components/shared';
import { ROUTES } from '@/constants/routes';
import Link from 'next/link';
import React from 'react';

export const Footer: React.FC = () => {
  return (
    <footer className="py-12 sm:py-14 md:py-16 px-4 sm:px-6 border-t border-[var(--dashboard-border)] bg-[var(--dashboard-bg)]">
      <div className="max-w-7xl mx-auto">
        {/* Logo and Branding */}
        <div className="flex flex-col items-center mb-8 sm:mb-10">
          <Logo size="md" variant="full" className="mb-4 opacity-70" />
          <p className="text-gray-600 text-[10px] sm:text-xs font-bold uppercase tracking-widest mb-6">
            © 2026 ServiceLink • Built for the Pros
          </p>
        </div>

        {/* Links and Contact */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 sm:gap-8 text-xs sm:text-sm text-gray-400">
          {/* Contact Email */}
          <a
            href="mailto:app.servicelink@gmail.com"
            className="hover:text-white transition-colors flex items-center gap-2"
          >
            <svg
              className="w-4 h-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
              />
            </svg>
            app.servicelink@gmail.com
          </a>

          {/* Resources & Legal Links */}
          <div className="flex items-center gap-4 sm:gap-6 flex-wrap justify-center">
            <Link
              href={ROUTES.PRICING_PAGE}
              className="hover:text-white transition-colors"
            >
              Pricing
            </Link>
            <span className="text-gray-600">•</span>
            <Link
              href={ROUTES.RESOURCES}
              className="hover:text-white transition-colors"
            >
              Resources
            </Link>
            <span className="text-gray-600">•</span>
            <Link
              href={ROUTES.TERMS}
              className="hover:text-white transition-colors"
            >
              Terms of Service
            </Link>
            <span className="text-gray-600">•</span>
            <Link
              href={ROUTES.PRIVACY}
              className="hover:text-white transition-colors"
            >
              Privacy Policy
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
};
