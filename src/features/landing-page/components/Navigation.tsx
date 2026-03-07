'use client';

import { Button, Logo } from '@/components/shared';
import { ROUTES } from '@/constants/routes';
import { useAuth } from '@/features/auth/hooks/useAuth';
import { Bars3Icon, XMarkIcon } from '@heroicons/react/24/outline';
import React, { useState } from 'react';

export const Navigation: React.FC = () => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const { isAuthenticated } = useAuth();

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

  return (
    <nav className="fixed top-0 w-full z-50 bg-[var(--dashboard-bg)] border-b border-[var(--dashboard-border)]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 sm:h-20 flex items-center justify-between">
        {/* Logo */}
        <div className="flex items-center">
          <Logo size="md" logoSize="lg" href="/" className="sm:scale-110" />
        </div>

        {/* Desktop Navigation */}
        <div className="hidden md:flex items-center gap-8 text-sm font-medium text-gray-400">
          <button
            onClick={() => scrollToSection('how-it-works')}
            className="hover:text-white transition-colors"
          >
            How it Works
          </button>
          <button
            onClick={() => scrollToSection('problem')}
            className="hover:text-white transition-colors"
          >
            The Problem
          </button>
        </div>

        {/* Desktop Auth Buttons — shared Button variants only */}
        <div className="hidden md:flex items-center gap-3">
          {isAuthenticated ? (
            <Button href={ROUTES.DASHBOARD.MAIN} variant="secondary" size="md">
              Dashboard
            </Button>
          ) : (
            <>
              <Button href={ROUTES.AUTH.LOGIN} variant="secondary" size="md">
                Login
              </Button>
              <Button href={ROUTES.AUTH.SIGNUP} variant="inverse" size="md">
                Sign Up
              </Button>
            </>
          )}
        </div>

        {/* Mobile menu button */}
        <div className="md:hidden flex items-center">
          <button
            onClick={toggleMobileMenu}
            className="text-gray-300 hover:text-white p-2 rounded-md"
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
            <button
              onClick={() => scrollToSection('how-it-works')}
              className="text-gray-300 hover:text-white block w-full text-left py-3 px-2 text-base font-medium transition-colors rounded-lg active:bg-white/5"
            >
              How it Works
            </button>
            <button
              onClick={() => scrollToSection('problem')}
              className="text-gray-300 hover:text-white block w-full text-left py-3 px-2 text-base font-medium transition-colors rounded-lg active:bg-white/5"
            >
              The Problem
            </button>
            <div className="pt-5 mt-4 border-t border-[var(--dashboard-border)] space-y-3">
              {isAuthenticated ? (
                <Button
                  href={ROUTES.DASHBOARD.MAIN}
                  variant="secondary"
                  size="md"
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
                    size="md"
                    fullWidth
                    onClick={closeMobileMenu}
                  >
                    Login
                  </Button>
                  <Button
                    href={ROUTES.AUTH.SIGNUP}
                    variant="inverse"
                    size="md"
                    fullWidth
                    onClick={closeMobileMenu}
                  >
                    Sign Up
                  </Button>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </nav>
  );
};
