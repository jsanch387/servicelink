'use client';

import { ROUTES } from '@/constants/routes';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import React from 'react';

const SECTIONS = [
  { id: 'inbox', label: 'Reviews', href: ROUTES.DASHBOARD.REVIEWS },
  {
    id: 'settings',
    label: 'Settings',
    href: ROUTES.DASHBOARD.REVIEWS_SETTINGS,
  },
] as const;

function sectionFromPath(pathname: string): (typeof SECTIONS)[number]['id'] {
  if (pathname.startsWith(ROUTES.DASHBOARD.REVIEWS_SETTINGS)) {
    return 'settings';
  }
  return 'inbox';
}

export function ReviewsSectionNav() {
  const pathname = usePathname();
  const current = sectionFromPath(pathname);

  return (
    <div className="border-b border-white/10">
      <nav className="-mb-px flex gap-8" aria-label="Reviews">
        {SECTIONS.map(section => {
          const active = current === section.id;
          return (
            <Link
              key={section.id}
              href={section.href}
              aria-current={active ? 'page' : undefined}
              className={`cursor-pointer whitespace-nowrap border-b-2 px-1 pb-3 text-sm font-semibold transition-colors ${
                active
                  ? 'border-white text-white'
                  : 'border-transparent text-zinc-400 hover:border-zinc-500 hover:text-zinc-200'
              }`}
            >
              {section.label}
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
