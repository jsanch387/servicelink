'use client';

import { ROUTES } from '@/constants/routes';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import React from 'react';

const SECTIONS = [
  { id: 'revenue', label: 'Revenue', href: ROUTES.DASHBOARD.PAYMENTS },
  {
    id: 'transactions',
    label: 'Transactions',
    href: ROUTES.DASHBOARD.PAYMENTS_TRANSACTIONS,
  },
  {
    id: 'settings',
    label: 'Settings',
    href: ROUTES.DASHBOARD.PAYMENTS_SETTINGS,
  },
] as const;

function sectionFromPath(pathname: string): (typeof SECTIONS)[number]['id'] {
  if (pathname.startsWith(ROUTES.DASHBOARD.PAYMENTS_TRANSACTIONS)) {
    return 'transactions';
  }
  if (pathname.startsWith(ROUTES.DASHBOARD.PAYMENTS_SETTINGS)) {
    return 'settings';
  }
  return 'revenue';
}

export function PaymentsSectionNav() {
  const pathname = usePathname();
  const current = sectionFromPath(pathname);

  return (
    <nav
      className="flex w-full gap-1 rounded-xl border border-white/10 bg-white/[0.03] p-1"
      aria-label="Payments"
    >
      {SECTIONS.map(section => {
        const active = current === section.id;
        return (
          <Link
            key={section.id}
            href={section.href}
            aria-current={active ? 'page' : undefined}
            className={`flex-1 cursor-pointer rounded-lg px-3 py-2 text-center text-sm font-medium tracking-tight transition-colors ${
              active
                ? 'bg-white text-black'
                : 'text-zinc-400 hover:bg-white/[0.05] hover:text-white'
            }`}
          >
            {section.label}
          </Link>
        );
      })}
    </nav>
  );
}
