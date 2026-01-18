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
    <nav className="fixed top-0 w-full z-50 bg-white/5 backdrop-blur-xl border-b border-white/10">
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

        {/* Desktop Auth Buttons */}
        <div className="hidden md:flex items-center gap-3">
          {isAuthenticated ? (
            <Button
              href={ROUTES.DASHBOARD.MAIN}
              variant="primary"
              size="sm"
              className="px-6 py-2.5 rounded-full font-bold text-sm hover:scale-105 transition-all"
            >
              Dashboard
            </Button>
          ) : (
            <>
              <Button
                href={ROUTES.AUTH.LOGIN}
                variant="secondary"
                size="sm"
                className="px-6 py-2.5 rounded-full font-bold text-sm hover:scale-105 transition-all"
              >
                Login
              </Button>
              <Button
                href={ROUTES.AUTH.SIGNUP}
                variant="primary"
                size="sm"
                className="px-6 py-2.5 bg-white text-black rounded-full font-bold text-sm hover:scale-105 transition-all"
              >
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

      {/* Mobile Navigation Menu */}
      {isMobileMenuOpen && (
        <div className="md:hidden border-t border-white/10 bg-white/5 backdrop-blur-xl">
          <div className="px-6 py-4 space-y-4">
            <button
              onClick={() => scrollToSection('how-it-works')}
              className="text-gray-300 hover:text-white block w-full text-left text-base font-medium transition-colors"
            >
              How it Works
            </button>
            <button
              onClick={() => scrollToSection('problem')}
              className="text-gray-300 hover:text-white block w-full text-left text-base font-medium transition-colors"
            >
              The Problem
            </button>
            <div className="pt-4 border-t border-white/10 space-y-2">
              {isAuthenticated ? (
                <Button
                  href={ROUTES.DASHBOARD.MAIN}
                  variant="primary"
                  size="sm"
                  className="w-full justify-center rounded-full"
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
                    className="w-full justify-center rounded-full"
                    onClick={closeMobileMenu}
                  >
                    Login
                  </Button>
                  <Button
                    href={ROUTES.AUTH.SIGNUP}
                    variant="primary"
                    size="sm"
                    className="w-full justify-center rounded-full bg-white text-black"
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
