'use client';

import { Button, Logo } from '@/components/shared';
import { ROUTES } from '@/constants/routes';
import { siteSignupPath } from '@/features/marketing-attribution';
import { useAuth } from '@/features/auth/hooks/useAuth';
import { Bars3Icon, XMarkIcon } from '@heroicons/react/24/outline';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';

import {
  ResourcesNavMenuDesktop,
  ResourcesNavMenuMobile,
} from './ResourcesNavMenu';

const PRIMARY_NAV_LINKS = [
  { label: 'Features', href: ROUTES.FEATURES_PAGE },
  { label: 'Pricing', href: ROUTES.PRICING_PAGE },
] as const;

const FIND_DETAILERS_LINK = {
  label: 'Find detailers',
  href: ROUTES.FIND_DETAILERS,
} as const;

const MENU_ANIMATION_MS = 400;

function isNavPathActive(pathname: string, href: string) {
  return pathname === href || pathname.startsWith(`${href}/`);
}

function mobileTabClass(active: boolean) {
  return `flex w-full items-center rounded-2xl px-3 py-3.5 text-[1.7rem] font-semibold tracking-tight leading-none cursor-pointer transition-colors ${
    active ? 'text-white' : 'text-white/50 active:text-white'
  }`;
}

const navCtaBase =
  'inline-flex items-center justify-center h-9 w-[5.5rem] px-3 text-base font-semibold rounded-lg cursor-pointer transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-white/30';

const navLoginClass = `${navCtaBase} bg-white/10 text-white hover:bg-white/15`;

const navSignupClass = `${navCtaBase} bg-white text-black hover:bg-gray-100`;

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

  const primaryNavLinks = showFindDetailers
    ? [FIND_DETAILERS_LINK, ...PRIMARY_NAV_LINKS]
    : PRIMARY_NAV_LINKS;

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
    'cursor-pointer text-white hover:text-white/80 transition-colors focus:outline-none focus-visible:outline-none';

  const mobileMenu =
    portalReady && isMobileMenuMounted
      ? createPortal(
          <div
            className={`md:hidden fixed inset-0 z-[60] flex flex-col bg-[var(--dashboard-bg)] transition-[opacity,transform] duration-[350ms] ease-[cubic-bezier(0.32,0.72,0,1)] ${
              isMobileMenuVisible
                ? 'opacity-100 translate-y-0'
                : 'opacity-0 -translate-y-3'
            }`}
            role="dialog"
            aria-modal="true"
            aria-label="Menu"
          >
            <div className="flex h-16 shrink-0 items-center justify-between gap-4 px-4">
              <span className="cursor-pointer" onClick={closeMobileMenu}>
                <Logo size="md" logoSize="lg" href="/" />
              </span>
              <button
                type="button"
                onClick={closeMobileMenu}
                className="flex h-10 w-10 cursor-pointer items-center justify-center rounded-full bg-white/[0.06] text-white transition-colors active:bg-white/[0.1] focus:outline-none focus-visible:outline-none"
                aria-label="Close menu"
              >
                <XMarkIcon className="h-5 w-5" />
              </button>
            </div>

            <div
              className={`flex-1 overflow-y-auto overscroll-contain px-4 pt-4 pb-6 transition-[opacity,transform] duration-[400ms] ease-[cubic-bezier(0.32,0.72,0,1)] ${
                isMobileMenuVisible
                  ? 'opacity-100 translate-y-0'
                  : 'opacity-0 translate-y-3'
              }`}
            >
              <ul className="space-y-0.5">
                {primaryNavLinks.map(item => (
                  <li key={item.href}>
                    <Link
                      href={item.href}
                      className={mobileTabClass(
                        isNavPathActive(pathname, item.href)
                      )}
                      onClick={closeMobileMenu}
                    >
                      {item.label}
                    </Link>
                  </li>
                ))}
                <ResourcesNavMenuMobile
                  onNavigate={closeMobileMenu}
                  menuOpen={isMobileMenuOpen}
                />
              </ul>
            </div>

            <div
              className={`shrink-0 border-t border-white/[0.06] px-4 pt-4 pb-[max(1.25rem,env(safe-area-inset-bottom))] transition-opacity duration-[400ms] ease-[cubic-bezier(0.32,0.72,0,1)] ${
                isMobileMenuVisible ? 'opacity-100' : 'opacity-0'
              }`}
            >
              {!isInitialized ? (
                <div
                  className="h-12 w-full rounded-[10px] bg-white/5 animate-pulse"
                  aria-hidden
                />
              ) : isAuthenticated ? (
                <Button
                  href={ROUTES.DASHBOARD.MAIN}
                  variant="primary"
                  size="md"
                  fullWidth
                  onClick={closeMobileMenu}
                >
                  Dashboard
                </Button>
              ) : (
                <div className="space-y-2.5">
                  <Button
                    href={siteSignupPath('homepage')}
                    variant="primary"
                    size="md"
                    fullWidth
                    onClick={closeMobileMenu}
                  >
                    Sign up
                  </Button>
                  <Button
                    href={ROUTES.AUTH.LOGIN}
                    variant="secondary"
                    size="md"
                    fullWidth
                    onClick={closeMobileMenu}
                  >
                    Login
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

          <div className="hidden md:flex items-center gap-2 min-w-[7.5rem] justify-end">
            {!isInitialized ? (
              <span
                className="h-9 w-[11.5rem] rounded-lg bg-white/5 animate-pulse"
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
                <Link href={ROUTES.AUTH.LOGIN} className={navLoginClass}>
                  Login
                </Link>
                <Link
                  href={siteSignupPath('homepage')}
                  className={navSignupClass}
                >
                  Sign up
                </Link>
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
