import Link from 'next/link';
import React from 'react';

interface FramedCtaButtonProps {
  href: string;
  children: React.ReactNode;
  className?: string;
}

export const FramedCtaButton: React.FC<FramedCtaButtonProps> = ({
  href,
  children,
  className = '',
}) => {
  return (
    <Link
      href={href}
      className={`group relative inline-flex min-h-[52px] w-full items-center justify-center px-8 py-3 text-base font-black uppercase tracking-[0.12em] text-gray-100 transition-colors duration-200 hover:text-white focus:outline-none focus:ring-2 focus:ring-white/35 focus:ring-offset-2 focus:ring-offset-[#0f0f0f] sm:w-auto sm:min-w-[14rem] ${className}`}
    >
      <span className="pointer-events-none absolute inset-0 border border-white/35 transition-colors duration-200 group-hover:border-white/55" />
      <span className="pointer-events-none absolute left-0 top-0 h-4 w-4 border-l-[3px] border-t-[3px] border-white/95" />
      <span className="pointer-events-none absolute right-0 top-0 h-4 w-4 border-r-[3px] border-t-[3px] border-white/95" />
      <span className="pointer-events-none absolute bottom-0 left-0 h-4 w-4 border-b-[3px] border-l-[3px] border-white/95" />
      <span className="pointer-events-none absolute bottom-0 right-0 h-4 w-4 border-b-[3px] border-r-[3px] border-white/95" />
      <span className="relative z-[1]">{children}</span>
    </Link>
  );
};
