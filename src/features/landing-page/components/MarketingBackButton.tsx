import { ChevronLeftIcon } from '@heroicons/react/24/outline';
import Link from 'next/link';
import React from 'react';

interface MarketingBackButtonProps {
  href?: string;
  'aria-label'?: string;
  className?: string;
}

export const MarketingBackButton: React.FC<MarketingBackButtonProps> = ({
  href = '/',
  'aria-label': ariaLabel = 'Back to home',
  className = '',
}) => {
  return (
    <Link
      href={href}
      className={`inline-flex items-center justify-center min-h-[44px] min-w-[44px] -ml-2 text-gray-400 hover:text-white transition-colors ${className}`.trim()}
      aria-label={ariaLabel}
    >
      <ChevronLeftIcon className="h-6 w-6" strokeWidth={2} aria-hidden />
    </Link>
  );
};
