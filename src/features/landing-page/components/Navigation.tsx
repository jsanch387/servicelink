'use client';

import { Button, Logo } from '@/components/shared';
import { ROUTES } from '@/constants/routes';
import { useAuth } from '@/features/auth/hooks/useAuth';
import { Bars3Icon, XMarkIcon } from '@heroicons/react/24/outline';
import Link from 'next/link';
import React, { useState } from 'react';

import {
  ResourcesNavMenuDesktop,
  ResourcesNavMenuMobile,
} from './ResourcesNavMenu';

export const Navigation: React.FC = () => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const { isAuthenticated, isInitialized } = useAuth();

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };

  const closeMobileMenu = () => {
    setIsMobileMenuOpen(false);
  };

  const navLinkClass =
    'hover:text-white transition-colors focus:outline-none focus-visible:outline-none';
  const mobileNavLinkClass =
    'text-gray-300 hover:text-white block w-full text-left py-3 px-2 text-base font-medium transition-colors rounded-lg active:bg-white/5 focus:outline-none focus-visible:outline-none';

  return (
    <nav className="fixed top-0 w-full z-50 bg-[var(--dashboard-bg)] border-b border-[var(--dashboard-border)]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 sm:h-20 flex items-center justify-between">
        <div className="flex items-center">
          <Logo size="md" logoSize="lg" href="/" className="sm:scale-110" />
        </div>

        <div className="hidden md:flex items-center gap-8 text-sm font-medium text-gray-400">
          <Link href={ROUTES.PRICING_PAGE} className={navLinkClass}>
            Pricing
          </Link>
          <ResourcesNavMenuDesktop />
        </div>

        <div className="hidden md:flex items-center gap-3 min-w-[7.5rem] justify-end">
          {!isInitialized ? (
            <span
              className="h-[42px] w-[11.5rem] rounded-[10px] bg-white/5 animate-pulse"
              aria-hidden
            />
          ) : isAuthenticated ? (
            <Button href={ROUTES.DASHBOARD.MAIN} variant="secondary" size="sm">
              Dashboard
            </Button>
          ) : (
            <>
              <Button href={ROUTES.AUTH.LOGIN} variant="secondary" size="sm">
                Login
              </Button>
              <Button href={ROUTES.AUTH.SIGNUP} variant="inverse" size="sm">
                Sign up
              </Button>
            </>
          )}
        </div>

        <div className="md:hidden flex items-center">
          <button
            onClick={toggleMobileMenu}
            className="text-gray-300 hover:text-white p-2 rounded-md focus:outline-none focus-visible:outline-none"
            aria-label="Toggle mobile menu"
          >
            {isMobileMenuOpen ? (
              <XMarkIcon className="h-6 w-6" />
            ) : (
              <Bars3Icon className="h-6 w-6" />
            )}
          </button>
        </div>
      </div>

      {isMobileMenuOpen && (
        <div className="md:hidden border-t border-[var(--dashboard-border)] bg-[var(--dashboard-bg)]">
          <div className="px-4 py-5 space-y-1">
            <Link
              href={ROUTES.PRICING_PAGE}
              className={mobileNavLinkClass}
              onClick={closeMobileMenu}
            >
              Pricing
            </Link>
            <ResourcesNavMenuMobile onNavigate={closeMobileMenu} />
            {isInitialized ? (
              <div className="pt-5 mt-4 border-t border-[var(--dashboard-border)] space-y-3">
                {isAuthenticated ? (
                  <Button
                    href={ROUTES.DASHBOARD.MAIN}
                    variant="secondary"
                    size="sm"
                    fullWidth
                    onClick={closeMobileMenu}
                  >
                    Dashboard
                  </Button>
                ) : (
                  <>
                    <Button
                      href={ROUTES.AUTH.LOGIN}
                      variant="secondary"
                      size="sm"
                      fullWidth
                      onClick={closeMobileMenu}
                    >
                      Login
                    </Button>
                    <Button
                      href={ROUTES.AUTH.SIGNUP}
                      variant="inverse"
                      size="sm"
                      fullWidth
                      onClick={closeMobileMenu}
                    >
                      Sign up
                    </Button>
                  </>
                )}
              </div>
            ) : null}
          </div>
        </div>
      )}
    </nav>
  );
};
