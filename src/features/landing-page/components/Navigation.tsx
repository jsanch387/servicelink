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
import {
  MARKETING_RESOURCES_MEGA_SLOT_ID,
  desktopNavItemClass,
  isNavPathActive,
} from './navStyles';

const PRIMARY_NAV_LINKS = [
  { label: 'Features', href: ROUTES.FEATURES_PAGE },
  { label: 'Pricing', href: ROUTES.PRICING_PAGE },
] as const;

const FIND_DETAILERS_LINK = {
  label: 'Find detailers',
  href: ROUTES.FIND_DETAILERS,
} as const;

const MENU_ANIMATION_MS = 320;

function mobileTabClass(active: boolean) {
  return `flex w-full items-center rounded-2xl px-4 py-4 text-[1.5rem] font-semibold tracking-tight leading-none cursor-pointer transition-colors ${
    active
      ? 'bg-white/[0.07] text-white'
      : 'text-white/45 active:bg-white/[0.05] active:text-white'
  }`;
}

const navCtaBase =
  'inline-flex items-center justify-center h-8 px-3.5 text-[13px] font-semibold tracking-[-0.01em] rounded-full cursor-pointer transition-all duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-white/30 md:h-10 md:px-5 md:text-[15px] lg:h-11 lg:px-6 lg:text-base';

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
    if (!isMobileMenuOpen) return;
    const html = document.documentElement;
    const scrollY = window.scrollY;
    const prevHtmlOverflow = html.style.overflow;
    html.style.overflow = 'hidden';
    document.body.style.position = 'fixed';
    document.body.style.top = `-${scrollY}px`;
    document.body.style.width = '100%';
    document.body.style.overflow = 'hidden';
    return () => {
      html.style.overflow = prevHtmlOverflow;
      document.body.style.position = '';
      document.body.style.top = '';
      document.body.style.width = '';
      document.body.style.overflow = '';
      window.scrollTo(0, scrollY);
    };
  }, [isMobileMenuOpen]);

  const openMobileMenu = () => {
    setIsMobileMenuOpen(true);
  };

  const closeMobileMenu = () => {
    setIsMobileMenuOpen(false);
  };

  const mobileMenu =
    portalReady && isMobileMenuMounted
      ? createPortal(
          <div
            className={`md:hidden fixed inset-0 z-[60] bg-[#111111] transition-transform duration-[320ms] ease-[cubic-bezier(0.32,0.72,0,1)] ${
              isMobileMenuVisible
                ? 'translate-x-0'
                : 'pointer-events-none translate-x-full'
            }`}
            role="dialog"
            aria-modal="true"
            aria-hidden={!isMobileMenuVisible}
            aria-label="Menu"
          >
            <div className="flex h-full flex-col">
              <div className="flex shrink-0 items-center justify-end px-3 pt-[max(0.75rem,env(safe-area-inset-top))]">
                <button
                  type="button"
                  onClick={closeMobileMenu}
                  className="inline-flex h-11 w-11 cursor-pointer items-center justify-center rounded-full bg-white text-neutral-950 transition-colors [touch-action:manipulation] active:bg-neutral-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-white/25"
                  aria-label="Close menu"
                >
                  <XMarkIcon className="h-6 w-6" />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto overscroll-contain px-5 pt-2 pb-6">
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

              <div className="shrink-0 px-5 pt-2 pb-[max(1.25rem,env(safe-area-inset-bottom))]">
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
        <div className="px-3 pt-3 sm:px-4 sm:pt-3.5 md:pt-5">
          <div className="relative mx-auto max-w-6xl md:max-w-7xl">
            <div
              className={`relative overflow-visible flex h-14 items-center justify-between gap-3 rounded-full px-2.5 sm:px-3 transition-all duration-300 md:h-[4.5rem] md:px-4 lg:h-20 lg:px-5 ${
                isScrolled
                  ? 'border border-white/10 bg-[#0f0f0f]/80 shadow-[0_8px_32px_rgba(0,0,0,0.45),inset_0_1px_0_rgba(255,255,255,0.08)] backdrop-blur-xl'
                  : 'border border-white/[0.08] bg-white/[0.05] shadow-[inset_0_1px_0_rgba(255,255,255,0.07)] backdrop-blur-md'
              }`}
            >
              <div className="flex min-w-0 items-center pl-1">
                <Logo
                  size="md"
                  href="/"
                  className="[&_img]:h-11 [&_img]:w-11 [&_span]:-ml-1 [&_span]:text-base [&_span]:!font-semibold md:[&_img]:h-11 md:[&_img]:w-11 md:[&_span]:text-lg lg:[&_img]:h-12 lg:[&_img]:w-12"
                />
              </div>

              <div className="absolute left-1/2 top-1/2 hidden -translate-x-1/2 -translate-y-1/2 items-center gap-1 md:flex lg:gap-1.5">
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

              <div className="hidden items-center justify-end gap-1.5 md:flex lg:gap-2">
                {!isInitialized ? (
                  <span
                    className="h-8 w-[9.5rem] rounded-full bg-white/5 animate-pulse md:h-10 lg:h-11 lg:w-[11rem]"
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
                  onClick={openMobileMenu}
                  className="inline-flex h-11 w-11 cursor-pointer items-center justify-center rounded-full text-white/70 transition-colors [touch-action:manipulation] hover:bg-white/[0.08] hover:text-white focus:outline-none focus-visible:ring-2 focus-visible:ring-white/25"
                  aria-label="Open menu"
                  aria-expanded={isMobileMenuOpen}
                >
                  <Bars3Icon className="h-6 w-6" />
                </button>
              </div>
            </div>
            <div id={MARKETING_RESOURCES_MEGA_SLOT_ID} />
          </div>
        </div>
      </nav>
      {mobileMenu}
    </>
  );
};
