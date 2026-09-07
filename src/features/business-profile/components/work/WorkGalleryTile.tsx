'use client';

import { ImageWithFallback } from '@/components/shared/ImageWithFallback';
import React, { useEffect, useState } from 'react';
import type { WorkPhoto } from '../../utils/workPhotoSrc';
import { RevealOnImageLoad } from '../RevealOnImageLoad';

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
  const [isLoaded, setIsLoaded] = useState(false);
  const src = useOriginal ? photo.src : photo.thumbSrc;

  useEffect(() => {
    setIsLoaded(false);
  }, [src]);

  return (
    <button
      type="button"
      onClick={onOpen}
      className="group relative aspect-square overflow-hidden rounded-xl bg-zinc-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/50"
      aria-label={alt}
    >
      <RevealOnImageLoad
        isLoaded={isLoaded}
        className="h-full w-full"
        skeletonClassName="rounded-xl"
      >
        {shouldLoad ? (
          <ImageWithFallback
            className={`relative z-10 h-full w-full object-cover transition-[opacity,transform] duration-300 group-hover:scale-[1.03] ${
              isLoaded ? 'opacity-100' : 'opacity-0'
            }`}
            src={src}
            alt={alt}
            width={600}
            height={600}
            fallbackLabel="WORK"
            fallbackSize={{ w: 600, h: 600 }}
            sizes="(max-width: 640px) 50vw, 33vw"
            priority={priority}
            onLoad={() => setIsLoaded(true)}
            onError={
              useOriginal || src === photo.src
                ? undefined
                : () => setUseOriginal(true)
            }
          />
        ) : null}
      </RevealOnImageLoad>
    </button>
  );
};
