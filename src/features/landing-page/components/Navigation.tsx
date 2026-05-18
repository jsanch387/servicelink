'use client';

import { Button, Logo } from '@/components/shared';
import { ROUTES } from '@/constants/routes';
import { useAuth } from '@/features/auth/hooks/useAuth';
import { Bars3Icon, XMarkIcon } from '@heroicons/react/24/outline';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import React, { useState } from 'react';

export const Navigation: React.FC = () => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const { isAuthenticated, isInitialized } = useAuth();
  const pathname = usePathname();
  const isHome = pathname === '/';

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };

  const closeMobileMenu = () => {
    setIsMobileMenuOpen(false);
  };

  const scrollToSection = (sectionId: string) => {
    const section = document.getElementById(sectionId);
    if (section) {
      section.scrollIntoView({ behavior: 'smooth' });
    }
    closeMobileMenu();
  };

  const navLinkClass =
    'hover:text-white transition-colors focus:outline-none focus-visible:outline-none';
  const mobileNavLinkClass =
    'text-gray-300 hover:text-white block w-full text-left py-3 px-2 text-base font-medium transition-colors rounded-lg active:bg-white/5 focus:outline-none focus-visible:outline-none';
  const navButtonClass = 'focus:ring-0 focus-visible:ring-0';

  return (
    <nav className="fixed top-0 w-full z-50 bg-[var(--dashboard-bg)] border-b border-[var(--dashboard-border)]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 sm:h-20 flex items-center justify-between">
        {/* Logo */}
        <div className="flex items-center">
          <Logo size="md" logoSize="lg" href="/" className="sm:scale-110" />
        </div>

        {/* Desktop Navigation */}
        <div className="hidden md:flex items-center gap-8 text-sm font-medium text-gray-400">
          {isHome ? (
            <>
              <button
                onClick={() => scrollToSection('how-it-works')}
                className={navLinkClass}
              >
                How it Works
              </button>
              <button
                onClick={() => scrollToSection('problem')}
                className={navLinkClass}
              >
                The Problem
              </button>
            </>
          ) : (
            <>
              <Link href="/#how-it-works" className={navLinkClass}>
                How it Works
              </Link>
              <Link href="/#problem" className={navLinkClass}>
                The Problem
              </Link>
            </>
          )}
          <a href={ROUTES.PRICING_PAGE} className={navLinkClass}>
            Pricing
          </a>
          <a href={ROUTES.RESOURCES} className={navLinkClass}>
            Resources
          </a>
        </div>

        {/* Desktop Auth Buttons — shared Button variants only */}
        <div className="hidden md:flex items-center gap-3 min-w-[7.5rem] justify-end">
          {!isInitialized ? (
            <span
              className="h-10 w-24 rounded-xl bg-white/5 animate-pulse"
              aria-hidden
            />
          ) : isAuthenticated ? (
            <Button
              href={ROUTES.DASHBOARD.MAIN}
              variant="secondary"
              className={navButtonClass}
            >
              Dashboard
            </Button>
          ) : (
            <>
              <Button
                href={ROUTES.AUTH.LOGIN}
                variant="secondary"
                className={navButtonClass}
              >
                Login
              </Button>
              <Button
                href={ROUTES.AUTH.SIGNUP}
                variant="inverse"
                className={navButtonClass}
              >
                Sign up
              </Button>
            </>
          )}
        </div>

        {/* Mobile menu button */}
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

      {/* Mobile Navigation Menu - touch-friendly buttons matching auth pages */}
      {isMobileMenuOpen && (
        <div className="md:hidden border-t border-[var(--dashboard-border)] bg-[var(--dashboard-bg)]">
          <div className="px-4 py-5 space-y-1">
            {isHome ? (
              <>
                <button
                  onClick={() => scrollToSection('how-it-works')}
                  className={mobileNavLinkClass}
                >
                  How it Works
                </button>
                <button
                  onClick={() => scrollToSection('problem')}
                  className={mobileNavLinkClass}
                >
                  The Problem
                </button>
              </>
            ) : (
              <>
                <Link
                  href="/#how-it-works"
                  className={mobileNavLinkClass}
                  onClick={closeMobileMenu}
                >
                  How it Works
                </Link>
                <Link
                  href="/#problem"
                  className={mobileNavLinkClass}
                  onClick={closeMobileMenu}
                >
                  The Problem
                </Link>
              </>
            )}
            <a
              href={ROUTES.PRICING_PAGE}
              className={mobileNavLinkClass}
              onClick={closeMobileMenu}
            >
              Pricing
            </a>
            <a
              href={ROUTES.RESOURCES}
              className={mobileNavLinkClass}
              onClick={closeMobileMenu}
            >
              Resources
            </a>
            {isInitialized ? (
              <div className="pt-5 mt-4 border-t border-[var(--dashboard-border)] space-y-3">
                {isAuthenticated ? (
                  <Button
                    href={ROUTES.DASHBOARD.MAIN}
                    variant="secondary"
                    fullWidth
                    className={navButtonClass}
                    onClick={closeMobileMenu}
                  >
                    Dashboard
                  </Button>
                ) : (
                  <>
                    <Button
                      href={ROUTES.AUTH.LOGIN}
                      variant="secondary"
                      fullWidth
                      className={navButtonClass}
                      onClick={closeMobileMenu}
                    >
                      Login
                    </Button>
                    <Button
                      href={ROUTES.AUTH.SIGNUP}
                      variant="inverse"
                      fullWidth
                      className={navButtonClass}
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
