'use client';

import { ImageWithFallback } from '@/components/shared/ImageWithFallback';
import React, { useState } from 'react';
import type { WorkPhoto } from '../../utils/workPhotoSrc';

interface WorkGalleryTileProps {
  photo: WorkPhoto;
  alt: string;
  shouldLoad: boolean;
  priority: boolean;
  onOpen: () => void;
}

export const WorkGalleryTile: React.FC<WorkGalleryTileProps> = ({
  photo,
  alt,
  shouldLoad,
  priority,
  onOpen,
}) => {
  const [useOriginal, setUseOriginal] = useState(false);
  const src = useOriginal ? photo.src : photo.thumbSrc;

  return (
    <button
      type="button"
      onClick={onOpen}
      className="group relative aspect-square overflow-hidden rounded-xl bg-zinc-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/50"
      aria-label={alt}
    >
      <div className="absolute inset-0 skeleton-image rounded-xl" aria-hidden />
      {shouldLoad ? (
        <ImageWithFallback
          className="relative z-10 h-full w-full object-cover transition-transform duration-300 group-hover:scale-[1.03]"
          src={src}
          alt={alt}
          width={600}
          height={600}
          fallbackLabel="WORK"
          fallbackSize={{ w: 600, h: 600 }}
          sizes="(max-width: 640px) 50vw, 33vw"
          priority={priority}
          onError={
            useOriginal || src === photo.src
              ? undefined
              : () => setUseOriginal(true)
          }
        />
      ) : null}
    </button>
  );
};
