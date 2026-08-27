'use client';

import { ImageWithFallback } from '@/components/shared/ImageWithFallback';
import type { PublicBookingFlowLocale } from '@/constants/routes';
import { publicBookingUi } from '@/libs/i18n/publicBookingUi';
import React, { useMemo, useState } from 'react';
import { WorkShowcaseLightbox } from '../../components/WorkShowcaseLightbox';
import { CompleteBusinessProfile } from '../../types/businessProfile';
import {
  buildPublicGalleryImages,
  type PublicGalleryImage,
} from '../../utils/galleryImageUrl';
import {
  bookingLinkV2GalleryFeaturedClassName,
  bookingLinkV2GallerySoloClassName,
  bookingLinkV2GalleryTileClassName,
} from '../utils/bookingLinkV2Surface';

interface BookingLinkV2GalleryProps {
  businessProfile: CompleteBusinessProfile;
  isPublic?: boolean;
  bookingFlowLocale?: PublicBookingFlowLocale;
}

export function BookingLinkV2Gallery({
  businessProfile,
  isPublic = false,
  bookingFlowLocale = 'en',
}: BookingLinkV2GalleryProps) {
  const ui = publicBookingUi(bookingFlowLocale);
  const [loadedIds, setLoadedIds] = useState<Set<string>>(new Set());
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);

  const galleryImages = useMemo(
    () =>
      buildPublicGalleryImages(
        businessProfile.images || [],
        ui.profile.galleryImageAlt
      ),
    [businessProfile.images, ui.profile.galleryImageAlt]
  );

  const handleImageLoad = React.useCallback((id: string) => {
    setLoadedIds(prev => new Set(prev).add(id));
  }, []);

  if (galleryImages.length === 0) {
    return (
      <section className="px-4 py-16 text-center sm:px-8">
        <p className="text-[15px] font-medium text-white">
          {ui.profile.galleryEmptyTitle}
        </p>
        {isPublic ? (
          <p className="mx-auto mt-1 max-w-sm text-sm leading-relaxed text-zinc-500">
            {ui.profile.galleryEmptyDescription}
          </p>
        ) : null}
      </section>
    );
  }

  const mosaicImages =
    galleryImages.length >= 3 ? galleryImages.slice(0, 3) : [];
  const trailingImages =
    galleryImages.length >= 3 ? galleryImages.slice(3) : [];

  return (
    <section className="px-4 py-4 sm:px-8 sm:py-5">
      <div className="flex flex-col gap-2">
        {galleryImages.length === 1 ? (
          <GalleryTile
            image={galleryImages[0]}
            index={0}
            variant="solo"
            loaded={loadedIds.has(galleryImages[0].id)}
            onOpen={() => setLightboxIndex(0)}
            onLoad={() => handleImageLoad(galleryImages[0].id)}
          />
        ) : galleryImages.length === 2 ? (
          <div className="grid grid-cols-2 gap-2">
            {galleryImages.map((image, index) => (
              <GalleryTile
                key={image.id}
                image={image}
                index={index}
                loaded={loadedIds.has(image.id)}
                onOpen={() => setLightboxIndex(index)}
                onLoad={() => handleImageLoad(image.id)}
              />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-2 grid-rows-2 gap-2 sm:grid-cols-3">
            {mosaicImages.map((image, index) => (
              <GalleryTile
                key={image.id}
                image={image}
                index={index}
                variant={index === 0 ? 'featured' : 'tile'}
                loaded={loadedIds.has(image.id)}
                onOpen={() => setLightboxIndex(index)}
                onLoad={() => handleImageLoad(image.id)}
              />
            ))}
          </div>
        )}

        {trailingImages.length === 1 ? (
          <GalleryTile
            image={trailingImages[0]}
            index={3}
            variant="solo"
            loaded={loadedIds.has(trailingImages[0].id)}
            onOpen={() => setLightboxIndex(3)}
            onLoad={() => handleImageLoad(trailingImages[0].id)}
          />
        ) : trailingImages.length > 1 ? (
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
            {trailingImages.map((image, trailingIndex) => {
              const index = trailingIndex + 3;
              return (
                <GalleryTile
                  key={image.id}
                  image={image}
                  index={index}
                  loaded={loadedIds.has(image.id)}
                  onOpen={() => setLightboxIndex(index)}
                  onLoad={() => handleImageLoad(image.id)}
                />
              );
            })}
          </div>
        ) : null}
      </div>

      {lightboxIndex != null && galleryImages[lightboxIndex] ? (
        <WorkShowcaseLightbox
          images={galleryImages.map(image => ({
            id: image.id,
            src: image.fullSrc,
            thumbSrc: image.thumbSrc || image.fullSrc,
            alt: image.alt,
          }))}
          index={lightboxIndex}
          onClose={() => setLightboxIndex(null)}
          onIndexChange={setLightboxIndex}
          closeLabel={ui.profile.galleryClosePhoto}
          previousLabel={ui.profile.galleryPreviousPhoto}
          nextLabel={ui.profile.galleryNextPhoto}
          countLabel={ui.profile.galleryPhotoCount}
        />
      ) : null}
    </section>
  );
}

function GalleryTile({
  image,
  index,
  variant = 'tile',
  loaded,
  onOpen,
  onLoad,
}: {
  image: PublicGalleryImage;
  index: number;
  variant?: 'solo' | 'featured' | 'tile';
  loaded: boolean;
  onOpen: () => void;
  onLoad: () => void;
}) {
  const src =
    variant === 'tile'
      ? image.thumbSrc || image.fullSrc
      : image.heroSrc || image.fullSrc;
  const className =
    variant === 'solo'
      ? bookingLinkV2GallerySoloClassName
      : variant === 'featured'
        ? bookingLinkV2GalleryFeaturedClassName
        : bookingLinkV2GalleryTileClassName;

  return (
    <button
      type="button"
      onClick={onOpen}
      className={className}
      aria-label={image.alt}
    >
      {!loaded ? (
        <div
          className="absolute inset-0 skeleton-image rounded-[inherit]"
          aria-hidden
        />
      ) : null}
      <ImageWithFallback
        className="absolute inset-0 z-10 h-full w-full object-cover transition-transform duration-500 ease-out group-hover:scale-[1.03]"
        src={src}
        retrySrc={image.fullSrc}
        alt={image.alt}
        width={variant === 'tile' ? 720 : 1200}
        height={variant === 'tile' ? 540 : 900}
        fallbackLabel="WORK"
        fallbackSize={
          variant === 'tile' ? { w: 720, h: 540 } : { w: 1200, h: 900 }
        }
        sizes={
          variant === 'solo'
            ? '(max-width: 640px) 100vw, 800px'
            : variant === 'featured'
              ? '(max-width: 640px) 60vw, 66vw'
              : '(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 280px'
        }
        priority={index < 3}
        onLoad={onLoad}
      />
    </button>
  );
}
