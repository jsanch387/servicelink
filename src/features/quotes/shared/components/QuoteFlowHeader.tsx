'use client';

import { ArrowLeftIcon } from '@heroicons/react/24/outline';
import Link from 'next/link';
import React from 'react';

interface QuoteFlowHeaderProps {
  backHref: string;
  backLabel: string;
  /** Omit title (and usually subtitle) during loading so the skeleton carries the UI. */
  title?: string;
  subtitle?: string;
  className?: string;
  /**
   * Full-viewport line directly under the back link (e.g. public quote request).
   */
  fullWidthDividerAfterBack?: boolean;
  /** Hide the default rule below the title/subtitle block. */
  hideDividerAfterTitle?: boolean;
}

export const QuoteFlowHeader: React.FC<QuoteFlowHeaderProps> = ({
  backHref,
  backLabel,
  title,
  subtitle,
  className = '',
  fullWidthDividerAfterBack = false,
  hideDividerAfterTitle = false,
}) => {
  const backLinkMb = fullWidthDividerAfterBack
    ? 'mb-4'
    : !title && hideDividerAfterTitle
      ? 'mb-0'
      : 'mb-6';

  return (
    <header className={`mb-6 sm:mb-8 ${className}`}>
      <Link
        href={backHref}
        className={`group -ml-1 inline-flex items-center gap-2 text-sm font-medium text-zinc-400 transition-colors hover:text-white ${backLinkMb}`}
      >
        <ArrowLeftIcon className="h-4 w-4 shrink-0" aria-hidden />
        {backLabel}
      </Link>
      {fullWidthDividerAfterBack ? (
        <div
          className="relative left-1/2 mb-6 h-px w-screen -translate-x-1/2 bg-white/10"
          aria-hidden
        />
      ) : null}
      {title ? (
        <>
          <h1 className="text-xl font-black tracking-tight text-white sm:text-2xl">
            {title}
          </h1>
          {subtitle ? (
            <p className="mt-0.5 max-w-xl text-sm text-gray-500">{subtitle}</p>
          ) : null}
        </>
      ) : null}
      {!hideDividerAfterTitle ? (
        <div
          className={`h-px w-full bg-white/10 ${title ? 'mt-4' : 'mt-2'}`}
          aria-hidden
        />
      ) : null}
    </header>
  );
};

export default QuoteFlowHeader;
