'use client';

import { ImageWithFallback } from '@/components/shared/ImageWithFallback';
import type { PublicBookingFlowLocale } from '@/constants/routes';
import { InstagramIcon } from '@/icons';
import { publicBookingUi } from '@/libs/i18n/publicBookingUi';
import { ChevronRightIcon } from '@heroicons/react/24/outline';
import React, { useMemo, useState } from 'react';
import { WorkShowcaseLightbox } from '../../components/WorkShowcaseLightbox';
import { CompleteBusinessProfile } from '../../types/businessProfile';
import {
  buildPublicGalleryImages,
  type PublicGalleryImage,
} from '../../utils/galleryImageUrl';
import { instagramProfileForDisplay } from '../../utils/socialMedia';
import {
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

  const instagram = useMemo(
    () => instagramProfileForDisplay(businessProfile.social_media),
    [businessProfile.social_media]
  );

  const handleImageLoad = React.useCallback((id: string) => {
    setLoadedIds(prev => new Set(prev).add(id));
  }, []);

  const instagramCta = instagram ? (
    <InstagramCta
      handle={instagram.handle}
      href={instagram.href}
      title={ui.profile.gallerySeeMoreOnInstagram}
      ariaLabel={ui.profile.galleryInstagramAriaLabel(instagram.handle)}
    />
  ) : null;

  if (galleryImages.length === 0) {
    return (
      <section className="px-4 py-10 sm:px-8 sm:py-12">
        <div className="mx-auto flex max-w-md flex-col items-center text-center">
          <p className="text-[15px] font-medium text-white">
            {ui.profile.galleryEmptyTitle}
          </p>
          <p className="mt-1 text-sm leading-relaxed text-zinc-500">
            {instagram
              ? ui.profile.galleryEmptyInstagramDescription
              : isPublic
                ? ui.profile.galleryEmptyDescription
                : null}
          </p>
          {instagramCta ? <div className="mt-5 w-full">{instagramCta}</div> : null}
        </div>
      </section>
    );
  }

  const gridClassName =
    galleryImages.length === 2 || galleryImages.length === 4
      ? 'grid grid-cols-2 gap-2 sm:gap-2.5'
      : 'grid grid-cols-2 gap-2 sm:grid-cols-3 sm:gap-2.5';

  return (
    <section className="px-4 py-4 sm:px-8 sm:py-5">
      <h2 className="mb-3 text-[15px] font-semibold tracking-tight text-white sm:mb-4">
        {ui.profile.galleryHeading}
      </h2>

      {galleryImages.length === 1 ? (
        <GalleryTile
          image={galleryImages[0]}
          index={0}
          variant="solo"
          loaded={loadedIds.has(galleryImages[0].id)}
          onOpen={() => setLightboxIndex(0)}
          onLoad={() => handleImageLoad(galleryImages[0].id)}
        />
      ) : (
        <div className={gridClassName}>
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
      )}

      {instagramCta ? <div className="mt-3 sm:mt-4">{instagramCta}</div> : null}

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

function InstagramCta({
  handle,
  href,
  title,
  ariaLabel,
}: {
  handle: string;
  href: string;
  title: string;
  ariaLabel: string;
}) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      aria-label={ariaLabel}
      className="flex min-h-[56px] w-full cursor-pointer items-center gap-3.5 rounded-[20px] border border-white/[0.08] bg-white/[0.04] px-3.5 py-3 text-left transition-colors hover:bg-white/[0.07] active:bg-white/[0.09] sm:px-4"
    >
      <span
        className="flex h-11 w-11 shrink-0 items-center justify-center rounded-[12px] bg-white/[0.08] text-white"
        aria-hidden
      >
        <InstagramIcon className="h-5 w-5" />
      </span>
      <span className="min-w-0 flex-1">
        <span className="block text-[15px] font-semibold leading-snug text-white">
          {title}
        </span>
        <span className="mt-0.5 block text-[13px] leading-5 text-zinc-500">
          @{handle}
        </span>
      </span>
      <ChevronRightIcon
        className="h-5 w-5 shrink-0 text-zinc-500"
        aria-hidden
      />
    </a>
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
  variant?: 'solo' | 'tile';
  loaded: boolean;
  onOpen: () => void;
  onLoad: () => void;
}) {
  const src =
    variant === 'solo'
      ? image.heroSrc || image.fullSrc
      : image.thumbSrc || image.fullSrc;
  const className =
    variant === 'solo'
      ? bookingLinkV2GallerySoloClassName
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
        width={variant === 'solo' ? 1200 : 720}
        height={variant === 'solo' ? 900 : 540}
        fallbackLabel="WORK"
        fallbackSize={
          variant === 'solo' ? { w: 1200, h: 900 } : { w: 720, h: 540 }
        }
        sizes={
          variant === 'solo'
            ? '(max-width: 640px) 100vw, 800px'
            : '(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 280px'
        }
        priority={index < 3}
        onLoad={onLoad}
      />
    </button>
  );
}
