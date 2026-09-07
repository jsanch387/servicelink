'use client';

import { ImageWithFallback } from '@/components/shared/ImageWithFallback';
import React, { useState } from 'react';

interface ProfileMediaImageProps {
  src: string;
  displaySrc: string;
  alt: string;
  width: number;
  height: number;
  className?: string;
  fallbackLabel: string;
  fallbackSize: { w: number; h: number };
  priority?: boolean;
  sizes?: string;
}

/**
 * Serves a resized Supabase render URL and falls back to the original
 * if image transformation is unavailable.
 */
export const ProfileMediaImage: React.FC<ProfileMediaImageProps> = ({
  src,
  displaySrc,
  alt,
  width,
  height,
  className,
  fallbackLabel,
  fallbackSize,
  priority = false,
  sizes,
}) => {
  const [useOriginal, setUseOriginal] = useState(false);
  const resolvedSrc = useOriginal ? src : displaySrc;

  return (
    <ImageWithFallback
      src={resolvedSrc}
      alt={alt}
      width={width}
      height={height}
      className={className}
      fallbackLabel={fallbackLabel}
      fallbackSize={fallbackSize}
      priority={priority}
      sizes={sizes}
      onError={
        useOriginal || resolvedSrc === src
          ? undefined
          : () => setUseOriginal(true)
      }
    />
  );
};
