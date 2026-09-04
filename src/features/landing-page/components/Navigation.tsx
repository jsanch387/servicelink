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
import { desktopNavItemClass, isNavPathActive } from './navStyles';

const PRIMARY_NAV_LINKS = [
  { label: 'Features', href: ROUTES.FEATURES_PAGE },
  { label: 'Pricing', href: ROUTES.PRICING_PAGE },
] as const;

const FIND_DETAILERS_LINK = {
  label: 'Find detailers',
  href: ROUTES.FIND_DETAILERS,
} as const;

const MENU_ANIMATION_MS = 280;

function mobileTabClass(active: boolean) {
  return `flex w-full items-center rounded-2xl px-4 py-4 text-[1.5rem] font-semibold tracking-tight leading-none cursor-pointer transition-colors ${
    active
      ? 'bg-white/[0.07] text-white'
      : 'text-white/45 active:bg-white/[0.05] active:text-white'
  }`;
}

const navCtaBase =
  'inline-flex items-center justify-center h-8 px-3.5 text-[13px] font-semibold tracking-[-0.01em] rounded-full cursor-pointer transition-all duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-white/30 md:h-10 md:px-5 md:text-[15px]';

const navLoginClass = `${navCtaBase} text-white/70 hover:text-white hover:bg-white/[0.08]`;

const navSignupClass = `${navCtaBase} bg-white text-neutral-950 shadow-[0_1px_2px_rgba(0,0,0,0.2),0_8px_20px_rgba(255,255,255,0.1)] hover:bg-neutral-100`;

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
  const [isScrolled, setIsScrolled] = useState(false);
  const { isAuthenticated, isInitialized } = useAuth();
  const pathname = usePathname();

  const primaryNavLinks = showFindDetailers
    ? [FIND_DETAILERS_LINK, ...PRIMARY_NAV_LINKS]
    : PRIMARY_NAV_LINKS;

  useEffect(() => {
    setPortalReady(true);
  }, []);

  useEffect(() => {
    const onScroll = () => setIsScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
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

  const barElevated = isScrolled || isMobileMenuMounted;

  const mobileMenu =
    portalReady && isMobileMenuMounted
      ? createPortal(
          <div
            className={`md:hidden fixed inset-0 z-40 transition-opacity duration-[280ms] ease-out ${
              isMobileMenuVisible ? 'opacity-100' : 'opacity-0'
            }`}
            role="dialog"
            aria-modal="true"
            aria-label="Menu"
          >
            <button
              type="button"
              className="absolute inset-0 cursor-pointer bg-black/55 backdrop-blur-sm"
              aria-label="Close menu"
              onClick={closeMobileMenu}
            />
            <div className="absolute inset-x-4 top-[4.75rem] bottom-4 flex flex-col overflow-hidden rounded-[1.75rem] border border-white/10 bg-[#141414]/92 shadow-[0_24px_80px_rgba(0,0,0,0.55)] backdrop-blur-xl">
              <div className="flex shrink-0 justify-end px-4 pt-4 pb-1">
                <button
                  type="button"
                  onClick={closeMobileMenu}
                  className="inline-flex h-10 w-10 cursor-pointer items-center justify-center rounded-full bg-white text-neutral-950 transition-colors hover:bg-neutral-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-white/30"
                  aria-label="Close menu"
                >
                  <XMarkIcon className="h-5 w-5" aria-hidden />
                </button>
              </div>
              <div className="flex-1 overflow-y-auto overscroll-contain px-4 pt-3 pb-6">
                <ul className="space-y-1.5">
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

              <div className="shrink-0 border-t border-white/[0.06] px-4 pt-4 pb-[max(1.25rem,env(safe-area-inset-bottom))]">
                {!isInitialized ? (
                  <div
                    className="h-12 w-full rounded-full bg-white/5 animate-pulse"
                    aria-hidden
                  />
                ) : isAuthenticated ? (
                  <Button
                    href={ROUTES.DASHBOARD.MAIN}
                    variant="primary"
                    size="md"
                    fullWidth
                    className="rounded-full"
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
                      className="rounded-full"
                      onClick={closeMobileMenu}
                    >
                      Sign up
                    </Button>
                    <Button
                      href={ROUTES.AUTH.LOGIN}
                      variant="secondary"
                      size="md"
                      fullWidth
                      className="rounded-full"
                      onClick={closeMobileMenu}
                    >
                      Login
                    </Button>
                  </div>
                )}
              </div>
            </div>
          </div>,
          document.body
        )
      : null;

  return (
    <>
      <nav className="fixed top-0 inset-x-0 z-50">
        <div className="px-3 pt-3 sm:px-4 sm:pt-3.5 md:pt-4">
          <div className="mx-auto max-w-6xl md:max-w-7xl">
            <div
              className={`relative flex h-14 items-center justify-between gap-3 rounded-full px-2.5 sm:px-3 transition-all duration-300 md:h-[4.5rem] md:px-5 ${
                barElevated
                  ? 'border border-white/10 bg-[#0f0f0f]/80 shadow-[0_8px_32px_rgba(0,0,0,0.45),inset_0_1px_0_rgba(255,255,255,0.08)] backdrop-blur-xl'
                  : 'border border-white/[0.08] bg-white/[0.05] shadow-[inset_0_1px_0_rgba(255,255,255,0.07)] backdrop-blur-md'
              }`}
            >
              <div className="flex min-w-0 items-center pl-1 md:scale-110 md:origin-left">
                <Logo size="md" href="/" />
              </div>

              <div className="absolute left-1/2 top-1/2 hidden -translate-x-1/2 -translate-y-1/2 items-center gap-1.5 md:flex">
                {primaryNavLinks.map(item => (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={desktopNavItemClass(
                      isNavPathActive(pathname, item.href)
                    )}
                  >
                    {item.label}
                  </Link>
                ))}
                <ResourcesNavMenuDesktop />
              </div>

              <div className="hidden items-center justify-end gap-1 md:flex">
                {!isInitialized ? (
                  <span
                    className="h-8 w-[9.5rem] rounded-full bg-white/5 animate-pulse md:h-10 md:w-[11rem]"
                    aria-hidden
                  />
                ) : isAuthenticated ? (
                  <Link href={ROUTES.DASHBOARD.MAIN} className={navSignupClass}>
                    Dashboard
                  </Link>
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

              <div className="flex items-center md:hidden">
                <button
                  type="button"
                  onClick={toggleMobileMenu}
                  className="inline-flex h-9 w-9 cursor-pointer items-center justify-center rounded-full text-white/70 transition-colors hover:bg-white/[0.08] hover:text-white focus:outline-none focus-visible:ring-2 focus-visible:ring-white/25"
                  aria-label={isMobileMenuMounted ? 'Close menu' : 'Open menu'}
                  aria-expanded={isMobileMenuOpen}
                >
                  <Bars3Icon className="h-5 w-5" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </nav>
      {mobileMenu}
    </>
  );
};
