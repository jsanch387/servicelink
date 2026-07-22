'use client';

import { Button, Logo } from '@/components/shared';
import { ROUTES } from '@/constants/routes';
import { useAuth } from '@/features/auth/hooks/useAuth';
import {
  Bars3Icon,
  CurrencyDollarIcon,
  MagnifyingGlassIcon,
  Squares2X2Icon,
  XMarkIcon,
} from '@heroicons/react/24/outline';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';

import {
  ResourcesNavMenuDesktop,
  ResourcesNavMenuMobile,
} from './ResourcesNavMenu';

const PRODUCT_LINKS = [
  {
    label: 'Features',
    href: ROUTES.FEATURES_PAGE,
    description: 'What you get with ServiceLink',
    icon: Squares2X2Icon,
  },
  {
    label: 'Pricing',
    href: ROUTES.PRICING_PAGE,
    description: 'Simple plans for service pros',
    icon: CurrencyDollarIcon,
  },
] as const;

const FIND_DETAILERS_LINK = {
  label: 'Find detailers',
  href: ROUTES.FIND_DETAILERS,
  description: 'Browse local detailing near you',
  icon: MagnifyingGlassIcon,
} as const;

const MENU_ANIMATION_MS = 300;

interface NavigationProps {
  /** When true, show a link to the public marketplace hub. */
  showFindDetailers?: boolean;
}

export const Navigation: React.FC<NavigationProps> = ({
  showFindDetailers = false,
}) => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isMobileMenuMounted, setIsMobileMenuMounted] = useState(false);
  const [isMobileMenuVisible, setIsMobileMenuVisible] = useState(false);
  const [portalReady, setPortalReady] = useState(false);
  const { isAuthenticated, isInitialized } = useAuth();
  const pathname = usePathname();

  const productLinks = showFindDetailers
    ? [FIND_DETAILERS_LINK, ...PRODUCT_LINKS]
    : PRODUCT_LINKS;

  useEffect(() => {
    setPortalReady(true);
  }, []);

  useEffect(() => {
    setIsMobileMenuOpen(false);
  }, [pathname]);

  useEffect(() => {
    if (isMobileMenuOpen) {
      setIsMobileMenuMounted(true);
      const id = window.setTimeout(() => setIsMobileMenuVisible(true), 20);
      return () => window.clearTimeout(id);
    }

    setIsMobileMenuVisible(false);
    const id = window.setTimeout(() => {
      setIsMobileMenuMounted(false);
    }, MENU_ANIMATION_MS);
    return () => window.clearTimeout(id);
  }, [isMobileMenuOpen]);

  useEffect(() => {
    if (!isMobileMenuOpen) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setIsMobileMenuOpen(false);
    };
    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, [isMobileMenuOpen]);

  useEffect(() => {
    if (!isMobileMenuMounted) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [isMobileMenuMounted]);

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(prev => !prev);
  };

  const closeMobileMenu = () => {
    setIsMobileMenuOpen(false);
  };

  const navLinkClass =
    'cursor-pointer text-gray-400 hover:text-white transition-colors focus:outline-none focus-visible:outline-none';

  const mobileMenu =
    portalReady && isMobileMenuMounted
      ? createPortal(
          <div
            className={`md:hidden fixed inset-0 z-[60] flex flex-col bg-[var(--dashboard-bg)] transition-transform duration-300 ease-[cubic-bezier(0.32,0.72,0,1)] ${
              isMobileMenuVisible ? 'translate-y-0' : '-translate-y-full'
            }`}
            role="dialog"
            aria-modal="true"
            aria-label="Menu"
          >
            <div className="flex h-16 shrink-0 items-center justify-between gap-4 border-b border-[var(--dashboard-border)] px-4">
              <Logo size="md" logoSize="lg" href="/" />
              <button
                type="button"
                onClick={closeMobileMenu}
                className="cursor-pointer text-gray-300 hover:text-white p-2 -mr-2 rounded-md focus:outline-none focus-visible:outline-none"
                aria-label="Close menu"
              >
                <XMarkIcon className="h-6 w-6" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto overscroll-contain px-3 pt-5 pb-4 space-y-6">
              <section>
                <p className="px-2.5 mb-1.5 text-xs font-semibold text-gray-500">
                  Product
                </p>
                <ul className="space-y-0.5">
                  {productLinks.map(item => {
                    const Icon = item.icon;
                    return (
                      <li key={item.href}>
                        <Link
                          href={item.href}
                          className="group flex items-start gap-3 rounded-lg p-2.5 cursor-pointer hover:bg-white/[0.04] active:bg-white/[0.06] transition-colors"
                          onClick={closeMobileMenu}
                        >
                          <span className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-white/[0.06] text-gray-300 group-hover:bg-white/[0.1] group-hover:text-white transition-colors">
                            <Icon className="h-4 w-4" aria-hidden />
                          </span>
                          <span className="min-w-0 pt-0.5">
                            <span className="block text-sm font-semibold text-white leading-snug">
                              {item.label}
                            </span>
                            <span className="block text-xs text-gray-500 mt-0.5 leading-snug">
                              {item.description}
                            </span>
                          </span>
                        </Link>
                      </li>
                    );
                  })}
                </ul>
              </section>

              <ResourcesNavMenuMobile onNavigate={closeMobileMenu} />
            </div>

            <div className="shrink-0 border-t border-[var(--dashboard-border)] px-4 py-4 pb-[max(1rem,env(safe-area-inset-bottom))]">
              {!isInitialized ? (
                <div
                  className="h-[42px] w-full rounded-[10px] bg-white/5 animate-pulse"
                  aria-hidden
                />
              ) : isAuthenticated ? (
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
                <div className="grid grid-cols-2 gap-3">
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
                    variant="primary"
                    size="sm"
                    fullWidth
                    onClick={closeMobileMenu}
                  >
                    Sign up
                  </Button>
                </div>
              )}
            </div>
          </div>,
          document.body
        )
      : null;

  return (
    <>
      <nav className="fixed top-0 w-full z-50 bg-[var(--dashboard-bg)]/95 backdrop-blur-md border-b border-[var(--dashboard-border)]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 sm:h-20 flex items-center justify-between gap-4">
          <div className="flex items-center min-w-0">
            <Logo size="md" logoSize="lg" href="/" className="sm:scale-110" />
          </div>

          <div className="hidden md:flex items-center gap-8 text-sm font-medium">
            {showFindDetailers ? (
              <Link href={ROUTES.FIND_DETAILERS} className={navLinkClass}>
                Find detailers
              </Link>
            ) : null}
            <Link href={ROUTES.FEATURES_PAGE} className={navLinkClass}>
              Features
            </Link>
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
              <Button
                href={ROUTES.DASHBOARD.MAIN}
                variant="secondary"
                size="sm"
              >
                Dashboard
              </Button>
            ) : (
              <>
                <Button href={ROUTES.AUTH.LOGIN} variant="secondary" size="sm">
                  Login
                </Button>
                <Button href={ROUTES.AUTH.SIGNUP} variant="primary" size="sm">
                  Sign up
                </Button>
              </>
            )}
          </div>

          <div className="md:hidden flex items-center">
            <button
              type="button"
              onClick={toggleMobileMenu}
              className="cursor-pointer text-gray-300 hover:text-white p-2 -mr-2 rounded-md focus:outline-none focus-visible:outline-none"
              aria-label={isMobileMenuOpen ? 'Close menu' : 'Open menu'}
              aria-expanded={isMobileMenuOpen}
            >
              {isMobileMenuOpen ? (
                <XMarkIcon className="h-6 w-6" />
              ) : (
                <Bars3Icon className="h-6 w-6" />
              )}
            </button>
          </div>
        </div>
      </nav>
      {mobileMenu}
    </>
  );
};
