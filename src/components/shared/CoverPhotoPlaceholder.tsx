/**
 * CoverPhotoPlaceholder - Modern empty state for cover photos
 *
 * Provides an engaging and professional placeholder when no cover photo is set
 */

import { CameraIcon } from '@heroicons/react/24/outline';
import React from 'react';

interface CoverPhotoPlaceholderProps {
  businessName?: string;
  className?: string;
  isPublic?: boolean; // New prop to indicate if this is for public viewing
}

export const CoverPhotoPlaceholder: React.FC<CoverPhotoPlaceholderProps> = ({
  businessName,
  className = '',
  isPublic = false,
}) => {
  return (
    <div
      className={`relative w-full h-full bg-gradient-to-br from-neutral-800 via-neutral-900 to-neutral-800 flex items-start justify-center pt-4 sm:pt-6 lg:pt-8 overflow-hidden ${className}`}
    >
      {/* Modern Background Pattern */}
      <div className="absolute inset-0">
        {/* Subtle gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-br from-orange-500/5 via-transparent to-blue-500/5"></div>

        {/* Geometric pattern */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-0 left-0 w-full h-full">
            <svg width="100%" height="100%" className="opacity-20">
              <defs>
                <pattern
                  id="grid"
                  width="40"
                  height="40"
                  patternUnits="userSpaceOnUse"
                >
                  <path
                    d="M 40 0 L 0 0 0 40"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="0.5"
                    className="text-neutral-600"
                  />
                </pattern>
              </defs>
              <rect width="100%" height="100%" fill="url(#grid)" />
            </svg>
          </div>
        </div>

        {/* Floating elements - more subtle on mobile */}
        <div className="absolute top-1/4 left-1/4 w-1.5 h-1.5 sm:w-2 sm:h-2 bg-orange-400/20 rounded-full animate-pulse"></div>
        <div className="absolute top-1/3 right-1/3 w-1 h-1 bg-blue-400/20 rounded-full animate-pulse delay-1000"></div>
        <div className="absolute bottom-1/3 left-1/3 w-1 h-1 sm:w-1.5 sm:h-1.5 bg-purple-400/20 rounded-full animate-pulse delay-2000"></div>
      </div>

      {/* Main Content - Positioned in top area only */}
      <div className="relative z-10 text-center px-4 sm:px-6 max-w-sm mx-auto">
        {/* Icon with modern styling - smaller and compact */}
        <div className="relative mb-3 sm:mb-4">
          <div className="w-12 h-12 sm:w-16 sm:h-16 mx-auto bg-gradient-to-br from-neutral-700 to-neutral-800 rounded-xl flex items-center justify-center shadow-xl border border-neutral-600/50">
            <CameraIcon className="h-6 w-6 sm:h-8 sm:w-8 text-neutral-400" />
          </div>
          {/* Subtle glow effect */}
          <div className="absolute inset-0 w-12 h-12 sm:w-16 sm:h-16 mx-auto bg-orange-400/10 rounded-xl blur-lg"></div>
        </div>

        {/* Content - Very compact */}
        <div className="space-y-1 sm:space-y-2">
          <h3 className="text-base sm:text-lg font-bold text-white">
            {businessName ? `${businessName}` : 'Business Profile'}
          </h3>
          {!isPublic && (
            <p className="text-neutral-400 text-xs sm:text-sm max-w-xs mx-auto leading-tight">
              {businessName
                ? `Add a professional cover photo`
                : 'Add a cover photo to stand out'}
            </p>
          )}
        </div>
      </div>

      {/* Bottom gradient for logo area - very prominent to prevent overlap */}
      <div className="absolute bottom-0 left-0 right-0 h-40 sm:h-44 bg-gradient-to-t from-neutral-900 via-neutral-900 to-neutral-900/30"></div>
    </div>
  );
};
