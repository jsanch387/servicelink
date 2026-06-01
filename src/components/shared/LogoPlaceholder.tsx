/**
 * LogoPlaceholder - Enhanced empty state for business logos
 *
 * Provides clear guidance and better UX for logo uploads
 */

import { CameraIcon, PhotoIcon } from '@heroicons/react/24/outline';
import React from 'react';

interface LogoPlaceholderProps {
  businessName?: string;
  className?: string;
  size?: 'sm' | 'md' | 'lg';
  isEditMode?: boolean; // New prop to indicate if this is in edit mode
}

export const LogoPlaceholder: React.FC<LogoPlaceholderProps> = ({
  className = '',
  size = 'md',
  isEditMode = false,
}) => {
  // Size configurations
  const sizeConfig = {
    sm: {
      container: 'w-20 h-20',
      icon: 'h-6 w-6',
      text: 'text-xs',
    },
    md: {
      container: 'w-32 h-32 sm:w-40 sm:h-40',
      icon: 'h-10 w-10 sm:h-12 sm:w-12',
      text: 'text-sm sm:text-base',
    },
    lg: {
      container: 'w-48 h-48',
      icon: 'h-16 w-16',
      text: 'text-base',
    },
  };

  const config = sizeConfig[size];

  // For edit mode, show modern placeholder
  if (isEditMode) {
    return (
      <div
        className={`${config.container} ${className} rounded-[2.4rem] border-2 border-dashed border-neutral-600 bg-neutral-800 flex items-center justify-center`}
      >
        <CameraIcon className={`${config.icon} text-neutral-500`} />
      </div>
    );
  }

  // For public viewing, show simple placeholder
  return (
    <div
      className={`${config.container} ${className} rounded-[2.4rem] border-4 border-neutral-900 shadow-lg bg-neutral-700 flex items-center justify-center`}
    >
      <PhotoIcon className={`${config.icon} text-neutral-400`} />
    </div>
  );
};
