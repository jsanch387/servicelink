'use client';

import { ROUTES } from '@/constants/routes';
import Link from 'next/link';
import type { ReactNode } from 'react';

import { setOwnerTestGuide, useOwnerTestGuidePhase } from '../ownerTestGuide';

export function OwnerTestReturnLink({
  label,
  fallback,
}: {
  label: string;
  fallback: ReactNode;
}) {
  const phase = useOwnerTestGuidePhase();
  const guided = phase === 'public' || phase === 'nav';
  if (!guided) return fallback;

  return (
    <Link
      href={ROUTES.DASHBOARD.MAIN}
      onClick={() => setOwnerTestGuide('nav')}
      className="flex min-h-[48px] w-full cursor-pointer items-center justify-center rounded-xl bg-white px-6 text-sm font-semibold text-black transition-colors hover:bg-gray-100"
    >
      {label}
    </Link>
  );
}
