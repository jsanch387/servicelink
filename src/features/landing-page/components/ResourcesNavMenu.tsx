'use client';

import { ROUTES } from '@/constants/routes';
import { ChevronDownIcon } from '@heroicons/react/24/outline';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import React, { useEffect, useRef, useState } from 'react';

import { RESOURCES_NAV_LINKS } from '../constants/resourcesNavLinks';

const navLinkClass =
  'hover:text-white transition-colors focus:outline-none focus-visible:outline-none';

const mobileNavLinkClass =
  'text-gray-300 hover:text-white block w-full text-left py-3 px-2 text-base font-medium transition-colors rounded-lg active:bg-white/5 focus:outline-none focus-visible:outline-none';

const mobileSubLinkClass =
  'text-gray-400 hover:text-white block w-full text-left py-2.5 pl-4 pr-2 text-sm font-medium transition-colors rounded-lg active:bg-white/5';

function isResourcesActive(pathname: string): boolean {
  return (
    pathname === ROUTES.RESOURCES ||
    pathname.startsWith(`${ROUTES.RESOURCES}/`) ||
    pathname === ROUTES.WORKSHOP_RUN_ADS
  );
}

export function ResourcesNavMenuDesktop() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const active = isResourcesActive(pathname);

  useEffect(() => {
    if (!open) return;
    const handlePointerDown = (e: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(e.target as Node)
      ) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handlePointerDown);
    return () => document.removeEventListener('mousedown', handlePointerDown);
  }, [open]);

  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  return (
    <div ref={containerRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen(prev => !prev)}
        className={`inline-flex items-center gap-1 ${navLinkClass} ${
          active ? 'text-white' : ''
        }`}
        aria-expanded={open}
        aria-haspopup="true"
      >
        Resources
        <ChevronDownIcon
          className={`h-4 w-4 transition-transform ${open ? 'rotate-180' : ''}`}
          aria-hidden
        />
      </button>

      {open ? (
        <div
          className="absolute top-full left-0 pt-2 z-50"
          role="menu"
          aria-label="Resources"
        >
          <div className="min-w-[240px] rounded-xl border border-white/10 bg-[var(--dashboard-bg)] shadow-xl py-1.5">
            {RESOURCES_NAV_LINKS.map(item => (
              <Link
                key={item.href}
                href={item.href}
                role="menuitem"
                className="block px-4 py-3 hover:bg-white/5 transition-colors first:rounded-t-xl last:rounded-b-xl"
                onClick={() => setOpen(false)}
              >
                <span className="block text-sm font-medium text-white">
                  {item.label}
                </span>
                <span className="block text-xs text-gray-500 mt-0.5">
                  {item.description}
                </span>
              </Link>
            ))}
          </div>
        </div>
      ) : null}
    </div>
  );
}

type ResourcesNavMenuMobileProps = {
  onNavigate: () => void;
};

export function ResourcesNavMenuMobile({
  onNavigate,
}: ResourcesNavMenuMobileProps) {
  const pathname = usePathname();
  const [expanded, setExpanded] = useState(isResourcesActive(pathname));

  return (
    <div>
      <button
        type="button"
        onClick={() => setExpanded(prev => !prev)}
        className={`${mobileNavLinkClass} inline-flex items-center justify-between`}
        aria-expanded={expanded}
      >
        <span>Resources</span>
        <ChevronDownIcon
          className={`h-5 w-5 shrink-0 transition-transform ${
            expanded ? 'rotate-180' : ''
          }`}
          aria-hidden
        />
      </button>
      {expanded ? (
        <div className="pb-1">
          {RESOURCES_NAV_LINKS.map(item => (
            <Link
              key={item.href}
              href={item.href}
              className={mobileSubLinkClass}
              onClick={onNavigate}
            >
              {item.label}
            </Link>
          ))}
        </div>
      ) : null}
    </div>
  );
}
