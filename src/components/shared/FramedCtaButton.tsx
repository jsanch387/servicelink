import Link from 'next/link';
import { ArrowRightIcon } from '@heroicons/react/24/outline';
import React from 'react';

interface FramedCtaButtonProps {
  href: string;
  children: React.ReactNode;
  className?: string;
  showArrow?: boolean;
}

export const FramedCtaButton: React.FC<FramedCtaButtonProps> = ({
  href,
  children,
  className = '',
  showArrow = false,
}) => {
  return (
    <Link
      href={href}
      className={`group relative inline-flex min-h-[52px] w-full items-center justify-center gap-2.5 bg-white/[0.04] px-8 py-3 text-base font-black uppercase tracking-[0.12em] text-gray-100 shadow-[0_0_0_1px_rgba(255,255,255,0.06),0_16px_40px_rgba(0,0,0,0.28)] transition-all duration-300 hover:-translate-y-0.5 hover:bg-white/[0.07] hover:text-white hover:shadow-[0_0_36px_rgba(255,255,255,0.1),0_20px_48px_rgba(0,0,0,0.32)] focus:outline-none focus:ring-2 focus:ring-white/35 focus:ring-offset-2 focus:ring-offset-[#0f0f0f] active:translate-y-0 active:scale-[0.99] sm:w-auto sm:min-w-[14rem] ${className}`}
    >
      <span className="pointer-events-none absolute inset-0 border border-white/30 transition-colors duration-300 group-hover:border-white/50" />
      <span className="pointer-events-none absolute left-0 top-0 h-4 w-4 border-l-[3px] border-t-[3px] border-white/95 transition-colors duration-300 group-hover:border-white" />
      <span className="pointer-events-none absolute right-0 top-0 h-4 w-4 border-r-[3px] border-t-[3px] border-white/95 transition-colors duration-300 group-hover:border-white" />
      <span className="pointer-events-none absolute bottom-0 left-0 h-4 w-4 border-b-[3px] border-l-[3px] border-white/95 transition-colors duration-300 group-hover:border-white" />
      <span className="pointer-events-none absolute bottom-0 right-0 h-4 w-4 border-b-[3px] border-r-[3px] border-white/95 transition-colors duration-300 group-hover:border-white" />
      <span className="relative z-[1]">{children}</span>
      {showArrow ? (
        <ArrowRightIcon
          aria-hidden
          className="relative z-[1] h-4 w-4 opacity-80 transition-transform duration-300 group-hover:translate-x-1 group-hover:opacity-100"
        />
      ) : null}
    </Link>
  );
};
