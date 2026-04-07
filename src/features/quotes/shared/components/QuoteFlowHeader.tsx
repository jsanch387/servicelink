'use client';

import { ArrowLeftIcon } from '@heroicons/react/24/outline';
import Link from 'next/link';
import React from 'react';

interface QuoteFlowHeaderProps {
  backHref: string;
  backLabel: string;
  title: string;
  subtitle: string;
  className?: string;
}

export const QuoteFlowHeader: React.FC<QuoteFlowHeaderProps> = ({
  backHref,
  backLabel,
  title,
  subtitle,
  className = '',
}) => {
  return (
    <header className={`mb-6 sm:mb-8 ${className}`}>
      <Link
        href={backHref}
        className="group -ml-1 mb-6 inline-flex items-center gap-2 text-sm font-medium text-zinc-400 transition-colors hover:text-white"
      >
        <ArrowLeftIcon className="h-4 w-4 shrink-0" aria-hidden />
        {backLabel}
      </Link>
      <h1 className="text-xl font-black tracking-tight text-white sm:text-2xl">
        {title}
      </h1>
      <p className="mt-0.5 max-w-xl text-sm text-gray-500">{subtitle}</p>
      <div className="mt-4 h-px w-full bg-white/10" aria-hidden />
    </header>
  );
};

export default QuoteFlowHeader;
