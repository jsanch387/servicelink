/**
 * CoverPhotoPlaceholder - Professional empty state for cover photos
 *
 * Provides an intuitive and visually appealing placeholder when no cover photo is set
 */

import { CameraIcon, PhotoIcon } from '@heroicons/react/24/outline';
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

      {/* Content */}
      <div className="relative z-10 text-center px-8">
        {/* Icon */}
        <div className="mb-4 flex justify-center">
          <div className="relative">
            <div className="w-16 h-16 bg-neutral-700 rounded-full flex items-center justify-center">
              <PhotoIcon className="h-8 w-8 text-neutral-400" />
            </div>
            <div className="absolute -top-1 -right-1 w-6 h-6 bg-orange-500 rounded-full flex items-center justify-center">
              <CameraIcon className="h-3 w-3 text-white" />
            </div>
          </div>
        </div>

        {/* Text */}
        <div className="space-y-2">
          <h3 className="text-lg font-semibold text-white">
            {businessName ? `${businessName}'s Cover Photo` : 'Cover Photo'}
          </h3>
          <p className="text-sm text-neutral-400 max-w-xs">
            No cover photo set yet
          </p>
        </div>
      </div>

      {/* Bottom gradient overlay */}
      <div className="absolute bottom-0 left-0 right-0 h-20 bg-gradient-to-t from-neutral-900 to-transparent"></div>
    </div>
  );
};
