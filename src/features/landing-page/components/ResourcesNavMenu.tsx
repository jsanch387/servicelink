'use client';

import { ROUTES } from '@/constants/routes';
import {
  AcademicCapIcon,
  ArrowRightIcon,
  BanknotesIcon,
  BookOpenIcon,
  CalendarDaysIcon,
  ChevronDownIcon,
  DevicePhoneMobileIcon,
} from '@heroicons/react/24/outline';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import React, { useCallback, useEffect, useId, useRef, useState } from 'react';

import {
  RESOURCES_NAV_COLUMNS,
  type ResourcesNavItem,
} from '../constants/resourcesNavLinks';

const CLOSE_DELAY_MS = 180;

const NAV_ICONS = {
  book: BookOpenIcon,
  calendar: CalendarDaysIcon,
  deposit: BanknotesIcon,
  instagram: DevicePhoneMobileIcon,
  workshop: AcademicCapIcon,
} as const;

function isResourcesActive(pathname: string): boolean {
  return (
    pathname === ROUTES.RESOURCES ||
    pathname.startsWith(`${ROUTES.RESOURCES}/`) ||
    pathname === ROUTES.WORKSHOP ||
    pathname === ROUTES.WORKSHOP_WATCH ||
    pathname === ROUTES.WORKSHOP_RUN_ADS
  );
}

function useResourcesMenuOpen() {
  const [open, setOpen] = useState(false);
  const closeTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const clearCloseTimer = useCallback(() => {
    if (closeTimerRef.current) {
      clearTimeout(closeTimerRef.current);
      closeTimerRef.current = null;
    }
  }, []);

  const openMenu = useCallback(() => {
    clearCloseTimer();
    setOpen(true);
  }, [clearCloseTimer]);

  const scheduleClose = useCallback(() => {
    clearCloseTimer();
    closeTimerRef.current = setTimeout(() => {
      setOpen(false);
      closeTimerRef.current = null;
    }, CLOSE_DELAY_MS);
  }, [clearCloseTimer]);

  const closeMenu = useCallback(() => {
    clearCloseTimer();
    setOpen(false);
  }, [clearCloseTimer]);

  const toggleMenu = useCallback(() => {
    clearCloseTimer();
    setOpen(prev => !prev);
  }, [clearCloseTimer]);

  useEffect(() => () => clearCloseTimer(), [clearCloseTimer]);

  return { open, openMenu, scheduleClose, closeMenu, toggleMenu };
}

function ResourcesNavItemLink({
  item,
  onNavigate,
}: {
  item: ResourcesNavItem;
  onNavigate: () => void;
}) {
  const Icon = NAV_ICONS[item.icon];

  return (
    <Link
      href={item.href}
      role="menuitem"
      className="group flex items-start gap-3 rounded-lg p-2.5 cursor-pointer hover:bg-white/[0.04] active:bg-white/[0.06] transition-colors"
      onClick={onNavigate}
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
  );
}

export function ResourcesNavMenuDesktop() {
  const pathname = usePathname();
  const menuId = useId();
  const containerRef = useRef<HTMLDivElement>(null);
  const { open, openMenu, scheduleClose, closeMenu, toggleMenu } =
    useResourcesMenuOpen();
  const active = isResourcesActive(pathname);

  useEffect(() => {
    closeMenu();
  }, [pathname, closeMenu]);

  useEffect(() => {
    if (!open) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') closeMenu();
    };
    const onPointerDown = (e: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(e.target as Node)
      ) {
        closeMenu();
      }
    };
    document.addEventListener('keydown', onKeyDown);
    document.addEventListener('mousedown', onPointerDown);
    return () => {
      document.removeEventListener('keydown', onKeyDown);
      document.removeEventListener('mousedown', onPointerDown);
    };
  }, [open, closeMenu]);

  return (
    <div
      ref={containerRef}
      className="relative"
      onMouseEnter={openMenu}
      onMouseLeave={scheduleClose}
    >
      <button
        type="button"
        onClick={toggleMenu}
        className={`inline-flex items-center gap-1 cursor-pointer hover:text-white transition-colors focus:outline-none focus-visible:outline-none ${
          active || open ? 'text-white' : 'text-gray-400'
        }`}
        aria-expanded={open}
        aria-haspopup="true"
        aria-controls={menuId}
      >
        Resources
        <ChevronDownIcon
          className={`h-3.5 w-3.5 transition-transform duration-200 ${
            open ? 'rotate-180' : ''
          }`}
          aria-hidden
        />
      </button>

      <div
        className={`fixed inset-x-0 top-16 sm:top-20 z-40 ${
          open ? 'pointer-events-auto' : 'pointer-events-none'
        }`}
        onMouseEnter={openMenu}
        onMouseLeave={scheduleClose}
      >
        <div className="h-3 -mt-3" aria-hidden />
        <div
          id={menuId}
          role="menu"
          aria-label="Resources"
          className={`border-b border-[var(--dashboard-border)] bg-[var(--dashboard-bg)] transition-all duration-200 ease-out ${
            open
              ? 'opacity-100 translate-y-0'
              : 'opacity-0 -translate-y-1 pointer-events-none'
          }`}
        >
          <div className="max-w-7xl mx-auto px-4 sm:px-6 pt-6 pb-5 sm:pt-7 sm:pb-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-8 sm:gap-10 lg:gap-16 max-w-3xl">
              {RESOURCES_NAV_COLUMNS.map(column => (
                <div key={column.heading}>
                  <p className="text-sm font-semibold text-white mb-3">
                    {column.heading}
                  </p>
                  <ul className="space-y-0.5">
                    {column.items.map(item => (
                      <li key={item.href}>
                        <ResourcesNavItemLink
                          item={item}
                          onNavigate={closeMenu}
                        />
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>

            <div className="mt-6 pt-4 border-t border-white/[0.06] flex justify-center">
              <Link
                href={ROUTES.RESOURCES}
                role="menuitem"
                className="group inline-flex items-center gap-2 text-sm font-medium text-gray-300 hover:text-white cursor-pointer transition-colors"
                onClick={closeMenu}
              >
                View all guides
                <span className="flex h-5 w-5 items-center justify-center rounded-full border border-white/15 group-hover:border-white/30 transition-colors">
                  <ArrowRightIcon className="h-3 w-3" aria-hidden />
                </span>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

type ResourcesNavMenuMobileProps = {
  onNavigate: () => void;
};

/** Flat, scannable Resources section for the mobile hamburger menu. */
export function ResourcesNavMenuMobile({
  onNavigate,
}: ResourcesNavMenuMobileProps) {
  return (
    <div className="space-y-5">
      {RESOURCES_NAV_COLUMNS.map(column => (
        <div key={column.heading}>
          <p className="px-2.5 mb-1.5 text-xs font-semibold text-gray-500">
            {column.heading}
          </p>
          <ul className="space-y-0.5">
            {column.items.map(item => (
              <li key={item.href}>
                <ResourcesNavItemLink item={item} onNavigate={onNavigate} />
              </li>
            ))}
          </ul>
        </div>
      ))}
    </div>
  );
}
