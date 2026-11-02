'use client';

import { ImageWithFallback } from '@/components/shared/ImageWithFallback';
import React, { useEffect, useState } from 'react';
import { RevealOnImageLoad } from './RevealOnImageLoad';

interface ProfileMediaImageProps {
  src: string;
  displaySrc: string;
  alt: string;
  width: number;
  height: number;
  className?: string;
  wrapperClassName?: string;
  skeletonClassName?: string;
  fallbackLabel: string;
  fallbackSize: { w: number; h: number };
  priority?: boolean;
  sizes?: string;
}

/**
 * Serves a resized Supabase render URL and falls back to the original
 * if image transformation is unavailable. Holds a skeleton until the
 * photo is fully decoded so the large original never paints in.
 */
export const ProfileMediaImage: React.FC<ProfileMediaImageProps> = ({
  src,
  displaySrc,
  alt,
  width,
  height,
  className,
  wrapperClassName,
  skeletonClassName,
  fallbackLabel,
  fallbackSize,
  priority = false,
  sizes,
}) => {
  const [useOriginal, setUseOriginal] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);
  const resolvedSrc = useOriginal ? src : displaySrc;

  useEffect(() => {
    setIsLoaded(false);
  }, [resolvedSrc]);

  return (
    <RevealOnImageLoad
      isLoaded={isLoaded}
      className={wrapperClassName}
      skeletonClassName={skeletonClassName}
    >
      <ImageWithFallback
        src={resolvedSrc}
        alt={alt}
        width={width}
        height={height}
        className={`${className ?? ''} transition-opacity duration-300 ease-out ${
          isLoaded ? 'opacity-100' : 'opacity-0'
        }`.trim()}
        fallbackLabel={fallbackLabel}
        fallbackSize={fallbackSize}
        priority={priority}
        sizes={sizes}
        onLoad={() => setIsLoaded(true)}
        onError={
          useOriginal || resolvedSrc === src
            ? undefined
            : () => setUseOriginal(true)
        }
      />
    </RevealOnImageLoad>
  );
};
