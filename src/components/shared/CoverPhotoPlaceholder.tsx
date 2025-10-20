/**
 * CoverPhotoPlaceholder - Professional empty state for cover photos
 *
 * Provides an intuitive and visually appealing placeholder when no cover photo is set
 */

import { PhotoIcon } from '@heroicons/react/24/outline';
import React from 'react';

interface CoverPhotoPlaceholderProps {
  businessName?: string;
  className?: string;
}

export const CoverPhotoPlaceholder: React.FC<CoverPhotoPlaceholderProps> = ({
  businessName,
  className = '',
}) => {
  return (
    <div
      className={`relative w-full h-full bg-gradient-to-br from-neutral-800 to-neutral-900 flex items-center justify-center ${className}`}
    >
      {/* Background Pattern */}
      <div className="absolute inset-0 opacity-5">
        <div className="absolute inset-0 bg-gradient-to-r from-orange-500/10 to-transparent"></div>
        <div className="absolute top-0 left-0 w-full h-full">
          <div className="grid grid-cols-8 grid-rows-4 h-full w-full">
            {Array.from({ length: 32 }).map((_, i) => (
              <div
                key={i}
                className="border-r border-b border-neutral-700/20"
              ></div>
            ))}
          </div>
        </div>
      </div>

      {/* Content - Compact and positioned to avoid logo overlap */}
      <div className="relative z-10 flex flex-col justify-start pt-6 sm:pt-8 px-4">
        {/* Small icon in top-left corner */}
        <div className="flex items-center space-x-2">
          <div className="w-8 h-8 bg-neutral-700 rounded-full flex items-center justify-center">
            <PhotoIcon className="h-4 w-4 text-neutral-400" />
          </div>
          <span className="text-sm text-neutral-400 font-medium">
            No cover photo set
          </span>
        </div>
      </div>

      {/* Bottom gradient overlay */}
      <div className="absolute bottom-0 left-0 right-0 h-20 bg-gradient-to-t from-neutral-900 to-transparent"></div>
    </div>
  );
};
