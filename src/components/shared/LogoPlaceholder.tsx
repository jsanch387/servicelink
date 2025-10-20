/**
 * LogoPlaceholder - Clean empty state for business logos
 *
 * Simple and clean placeholder when no logo is set
 */

import { PhotoIcon } from '@heroicons/react/24/outline';
import React from 'react';

interface LogoPlaceholderProps {
  businessName?: string;
  className?: string;
  size?: 'sm' | 'md' | 'lg';
}

export const LogoPlaceholder: React.FC<LogoPlaceholderProps> = ({
  businessName: _businessName,
  className = '',
  size = 'md',
}) => {
  // Size configurations
  const sizeConfig = {
    sm: {
      container: 'w-20 h-20',
      icon: 'h-6 w-6',
    },
    md: {
      container: 'w-32 h-32 sm:w-40 sm:h-40',
      icon: 'h-10 w-10 sm:h-12 sm:w-12',
    },
    lg: {
      container: 'w-48 h-48',
      icon: 'h-16 w-16',
    },
  };

  const config = sizeConfig[size];

  return (
    <div
      className={`${config.container} ${className} rounded-full border-4 border-neutral-800 shadow-lg bg-neutral-700 flex items-center justify-center`}
    >
      <PhotoIcon className={`${config.icon} text-neutral-400`} />
    </div>
  );
};
