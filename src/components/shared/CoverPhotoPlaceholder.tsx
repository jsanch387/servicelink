/**
 * CoverPhotoPlaceholder - Modern empty state for cover photos
 *
 * Provides a clean placeholder for public view and engaging empty state for edit mode
 */

import { CameraIcon } from '@heroicons/react/24/outline';
import React from 'react';

interface CoverPhotoPlaceholderProps {
  businessName?: string;
  className?: string;
  isPublic?: boolean; // Indicates if this is for public viewing
}

export const CoverPhotoPlaceholder: React.FC<CoverPhotoPlaceholderProps> = ({
  businessName,
  className = '',
  isPublic = false,
}) => {
  // For public view: Simple, clean gradient with just business name
  if (isPublic) {
    return (
      <div
        className={`relative w-full h-full bg-gradient-to-br from-neutral-800 via-neutral-900 to-neutral-800 flex items-center justify-center overflow-hidden ${className}`}
      >
        {/* Simple gradient background */}
        <div className="absolute inset-0 bg-gradient-to-br from-orange-500/10 via-transparent to-orange-500/5"></div>

        {/* Business name only - centered, positioned higher */}
        <div className="relative z-10 text-center px-6 -mt-12 sm:-mt-8">
          <h2 className="text-xl sm:text-2xl md:text-3xl lg:text-4xl font-extrabold text-white tracking-tight">
            {businessName || 'Business Profile'}
          </h2>
        </div>

        {/* Bottom gradient for logo area */}
        <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-neutral-900 via-neutral-900 to-neutral-900/30"></div>
      </div>
    );
  }

  // For edit/view mode: Empty state with prompt - positioned at top to avoid logo overlap
  return (
    <div
      className={`relative w-full h-full bg-gradient-to-br from-neutral-800 via-neutral-900 to-neutral-800 flex items-start justify-center pt-2 sm:pt-3 md:pt-4 lg:pt-6 overflow-hidden ${className}`}
    >
      {/* Subtle background pattern */}
      <div className="absolute inset-0 opacity-5">
        <div className="absolute inset-0 bg-gradient-to-br from-orange-500/10 via-transparent to-orange-500/5"></div>
      </div>

      {/* Empty state content - positioned at the top third of cover photo */}
      <div className="relative z-10 text-center px-4 sm:px-6 max-w-md mx-auto">
        {/* Icon - smaller on mobile */}
        <div className="relative mb-1.5 sm:mb-2">
          <div className="w-10 h-10 sm:w-12 sm:h-12 md:w-14 md:h-14 mx-auto bg-neutral-800/80 backdrop-blur-sm rounded-xl sm:rounded-2xl flex items-center justify-center border border-white/10 shadow-xl">
            <CameraIcon className="h-5 w-5 sm:h-6 sm:w-6 md:h-7 md:w-7 text-neutral-400" />
          </div>
          <div className="absolute inset-0 w-10 h-10 sm:w-12 sm:h-12 md:w-14 md:h-14 mx-auto bg-orange-500/10 rounded-xl sm:rounded-2xl blur-xl"></div>
        </div>

        {/* Prompt text - smaller on mobile */}
        <div>
          <h3 className="text-sm sm:text-base md:text-lg font-bold text-white">
            Add a Cover Photo
          </h3>
        </div>
      </div>

      {/* Bottom gradient for logo area - covers more space to prevent overlap */}
      <div className="absolute bottom-0 left-0 right-0 h-40 sm:h-44 md:h-48 bg-gradient-to-t from-neutral-900 via-neutral-900 to-neutral-900/30"></div>
    </div>
  );
};
