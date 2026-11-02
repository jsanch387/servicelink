import Link from 'next/link';
import { ArrowRightIcon } from '@heroicons/react/20/solid';
import React from 'react';

type HeroCtaButtonProps = {
  href: string;
  children: React.ReactNode;
  className?: string;
  variant?: 'primary' | 'ghost';
};

const PRIMARY_CLASS =
  'border-white/10 bg-white text-neutral-950 shadow-[0_1px_2px_rgba(0,0,0,0.2),0_12px_32px_rgba(255,255,255,0.12)] hover:bg-neutral-100 hover:shadow-[0_2px_4px_rgba(0,0,0,0.18),0_16px_40px_rgba(255,255,255,0.16)]';

const GHOST_CLASS =
  'border-white/20 bg-transparent text-white hover:border-white/35 hover:bg-white/[0.04]';

export function HeroCtaButton({
  href,
  children,
  className = '',
  variant = 'primary',
}: HeroCtaButtonProps) {
  const isGhost = variant === 'ghost';

  return (
    <Link
      href={href}
      className={`group inline-flex w-full cursor-pointer sm:w-auto min-w-[200px] items-center justify-center gap-2 rounded-full border px-7 py-3.5 text-[15px] font-semibold tracking-[-0.01em] transition-all duration-300 hover:-translate-y-0.5 focus:outline-none focus-visible:ring-2 focus-visible:ring-white/40 focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--dashboard-bg)] active:translate-y-0 active:scale-[0.98] ${
        isGhost ? GHOST_CLASS : PRIMARY_CLASS
      } ${className}`}
    >
      {children}
      {isGhost ? null : (
        <ArrowRightIcon
          aria-hidden
          className="h-4 w-4 text-neutral-500 transition-transform duration-300 group-hover:translate-x-0.5 group-hover:text-neutral-800"
        />
      )}
    </Link>
  );
}
