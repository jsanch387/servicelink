'use client';

import React from 'react';

interface RevealOnImageLoadProps {
  children: React.ReactNode;
  isLoaded: boolean;
  className?: string;
  skeletonClassName?: string;
}

/**
 * Keeps a shimmer skeleton up until the image has fully loaded, then
 * fades the photo in so progressive/partial paints never show.
 */
export const RevealOnImageLoad: React.FC<RevealOnImageLoadProps> = ({
  children,
  isLoaded,
  className = '',
  skeletonClassName = '',
}) => {
  return (
    <div className={`relative overflow-hidden ${className}`.trim()}>
      <div
        className={`pointer-events-none absolute inset-0 z-[1] skeleton-image transition-opacity duration-300 ease-out ${
          isLoaded ? 'opacity-0' : 'opacity-100'
        } ${skeletonClassName}`.trim()}
        aria-hidden
      />
      {children}
    </div>
  );
};
