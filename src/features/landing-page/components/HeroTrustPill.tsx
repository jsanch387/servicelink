import { ROUTES } from '@/constants/routes';
import { StarIcon } from '@heroicons/react/20/solid';
import Link from 'next/link';
import React from 'react';

export function HeroTrustPill() {
  return (
    <Link
      href={ROUTES.TESTIMONIALS}
      className="mb-5 inline-flex cursor-pointer items-center gap-1.5 rounded-full border border-white/10 bg-white/[0.05] px-3 py-1.5 text-[12px] font-medium tracking-[-0.01em] text-white/80 transition-colors hover:border-white/20 hover:bg-white/[0.08] hover:text-white sm:mb-6 sm:px-3.5 sm:text-[13px]"
    >
      <span className="flex items-center gap-0.5" aria-hidden>
        {Array.from({ length: 5 }, (_, index) => (
          <StarIcon
            key={index}
            className="h-3 w-3 text-amber-400 sm:h-3.5 sm:w-3.5"
          />
        ))}
      </span>
      Top rated on the App Store
    </Link>
  );
}
