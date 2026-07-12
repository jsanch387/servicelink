/**
 * CoverPhotoPlaceholder - Empty state for cover photos
 *
 * Public: minimal banner (name lives under the logo in ProfileHeader).
 * Edit/preview: prompt to add a cover photo.
 */

import { CameraIcon } from '@heroicons/react/24/outline';
import React from 'react';

interface CoverPhotoPlaceholderProps {
  className?: string;
  /** Public booking link — no duplicate name or edit prompts in the banner. */
  isPublic?: boolean;
}

export const CoverPhotoPlaceholder: React.FC<CoverPhotoPlaceholderProps> = ({
  className = '',
  isPublic = false,
}) => {
  if (isPublic) {
    return (
      <div
        className={`relative h-full w-full overflow-hidden bg-[#0f0f0f] ${className}`}
        aria-hidden
      >
        <div className="absolute inset-0 bg-gradient-to-b from-white/[0.05] via-white/[0.015] to-transparent" />
        <div
          className="absolute inset-0 opacity-[0.025] text-white"
          style={{
            backgroundImage:
              'radial-gradient(circle at 1px 1px, currentColor 1px, transparent 0)',
            backgroundSize: '28px 28px',
          }}
        />
        <div className="absolute inset-x-0 top-0 h-1/2 bg-gradient-to-b from-zinc-700/10 to-transparent" />
      </div>
    );
  }

  return (
    <div
      className={`relative flex h-full w-full items-start justify-center overflow-hidden bg-[#0f0f0f] pt-2 sm:pt-3 md:pt-4 lg:pt-6 ${className}`}
    >
      <div className="absolute inset-0 bg-gradient-to-b from-white/[0.04] via-transparent to-transparent" />

      <div className="relative z-10 mx-auto max-w-md px-4 text-center sm:px-6">
        <div className="relative mb-1.5 sm:mb-2">
          <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-xl border border-white/10 bg-white/[0.04] backdrop-blur-sm sm:h-12 sm:w-12 sm:rounded-2xl md:h-14 md:w-14">
            <CameraIcon className="h-5 w-5 text-zinc-400 sm:h-6 sm:w-6 md:h-7 md:w-7" />
          </div>
        </div>

        <h3 className="text-sm font-semibold text-zinc-200 sm:text-base md:text-lg">
          Add a Cover Photo
        </h3>
      </div>
    </div>
  );
};
