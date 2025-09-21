'use client';

import { Bars3Icon, XMarkIcon } from '@heroicons/react/24/outline';
import Image from 'next/image';
import React, { useState } from 'react';
// import { Button } from '../../../components/shared/Button'; // Will be used later
import { ROUTES } from '@/constants/routes';
// import { LanguageSelector } from './LanguageSelector'; // Will be used later
// import { useAuth } from '@/features/auth/hooks/useAuth'; // Will be used later

export const Navigation: React.FC = () => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  // const { isAuthenticated, user } = useAuth(); // Will be used later

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };

  const closeMobileMenu = () => {
    setIsMobileMenuOpen(false);
  };

  return (
    <nav className="bg-neutral-900/95 backdrop-blur-md border-b border-neutral-800 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <div className="flex items-center">
            <div className="flex-shrink-0 flex items-center">
              <Image
                src="/service-link-logo.png"
                alt="ServiceLink Logo"
                width={80}
                height={80}
                className="h-20 w-20 object-contain"
              />
              <h1 className="text-xl font-bold text-white">ServiceLink</h1>
            </div>
          </div>

          {/* Desktop Navigation - Centered */}
          <div className="hidden md:flex items-center space-x-8">
            <a
              href={ROUTES.HOME}
              className="text-gray-300 hover:text-white px-3 py-2 rounded-md text-sm font-medium transition-colors"
            >
              Home
            </a>
            <a
              href={ROUTES.FEATURES}
              className="text-gray-300 hover:text-white px-3 py-2 rounded-md text-sm font-medium transition-colors"
            >
              Features
            </a>
            <a
              href="#waitlist"
              className="text-gray-300 hover:text-white px-3 py-2 rounded-md text-sm font-medium transition-colors"
            >
              Waitlist
            </a>
            {/* <a
              href={ROUTES.ABOUT}
              className="text-gray-300 hover:text-white px-3 py-2 rounded-md text-sm font-medium transition-colors"
            >
              About
            </a> */}
          </div>

          {/* Desktop Auth Buttons - COMMENTED OUT FOR PRE-LAUNCH */}
          <div className="hidden md:flex items-center space-x-4">
            {/* <LanguageSelector /> */}
            {/*
            {isAuthenticated ? (
              <Button href={ROUTES.DASHBOARD.MAIN} variant="primary" size="sm">
                Dashboard
              </Button>
            ) : (
              <>
                <Button href={ROUTES.AUTH.LOGIN} variant="secondary" size="sm">
                  Login
                </Button>
                <Button href={ROUTES.WAITLIST_PAGE} variant="primary" size="sm">
                  Join Waitlist
                </Button>
              </>
            )}
            */}
          </div>

          {/* Mobile menu button */}
          <div className="md:hidden flex items-center space-x-2">
            {/* <LanguageSelector /> */}
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
          <div className="md:hidden">
            <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3 bg-neutral-800 rounded-lg mt-2 mb-4">
              <a
                href={ROUTES.HOME}
                className="text-gray-300 hover:text-white block px-3 py-2 rounded-md text-base font-medium transition-colors"
                onClick={closeMobileMenu}
              >
                Home
              </a>
              <a
                href={ROUTES.FEATURES}
                className="text-gray-300 hover:text-white block px-3 py-2 rounded-md text-base font-medium transition-colors"
                onClick={closeMobileMenu}
              >
                Features
              </a>
              <a
                href="#waitlist"
                className="text-gray-300 hover:text-white block px-3 py-2 rounded-md text-base font-medium transition-colors"
                onClick={closeMobileMenu}
              >
                Waitlist
              </a>
              <a
                href={ROUTES.ABOUT}
                className="text-gray-300 hover:text-white block px-3 py-2 rounded-md text-base font-medium transition-colors"
                onClick={closeMobileMenu}
              >
                About
              </a>

              {/* Mobile Auth Buttons - COMMENTED OUT FOR PRE-LAUNCH */}
              {/*
              <div className="pt-4 space-y-2">
                {isAuthenticated ? (
                  <Button
                    href={ROUTES.DASHBOARD.MAIN}
                    variant="primary"
                    size="sm"
                    className="w-full justify-center"
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
                      className="w-full justify-center"
                      onClick={closeMobileMenu}
                    >
                      Login
                    </Button>
                    <Button
                      href={ROUTES.WAITLIST_PAGE}
                      variant="primary"
                      size="sm"
                      className="w-full justify-center"
                      onClick={closeMobileMenu}
                    >
                      Join Waitlist
                    </Button>
                  </>
                )}
              </div>
              */}
            </div>
          </div>
        )}
      </div>
    </nav>
  );
};
