'use client';

import { ImageWithFallback } from '@/components/shared/ImageWithFallback';
import type { PublicBookingFlowLocale } from '@/constants/routes';
import { publicBookingUi } from '@/libs/i18n/publicBookingUi';
import React, { useMemo, useState } from 'react';
import { CompleteBusinessProfile, EditMode } from '../types/businessProfile';
import { buildPublicGalleryImages } from '../utils/galleryImageUrl';
import { EmptyState } from './EmptyState';
import { WorkShowcaseLightbox } from './WorkShowcaseLightbox';

interface WorkShowcaseProps {
  businessProfile: CompleteBusinessProfile;
  editMode: EditMode;
  onSave: (data: Record<string, unknown>) => Promise<void>;
  onCancel: () => void;
  isPublic?: boolean;
  bookingFlowLocale?: PublicBookingFlowLocale;
}

export const WorkShowcase: React.FC<WorkShowcaseProps> = ({
  businessProfile,
  editMode: _editMode,
  onSave: _onSave,
  onCancel: _onCancel,
  isPublic = false,
  bookingFlowLocale = 'en',
}) => {
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

  return (
    <section className="px-4 py-5 sm:px-8 sm:py-8">
      {galleryImages.length > 0 ? (
        <div className="grid grid-cols-2 gap-1.5 sm:grid-cols-3 sm:gap-2">
          {galleryImages.map((image, index) => {
            const loaded = loadedIds.has(image.id);
            return (
              <button
                key={image.id}
                type="button"
                onClick={() => setLightboxIndex(index)}
                className="group relative aspect-square cursor-pointer overflow-hidden rounded-lg bg-zinc-900 sm:rounded-xl"
                aria-label={image.alt}
              >
                {!loaded ? (
                  <div
                    className="absolute inset-0 skeleton-image rounded-[inherit]"
                    aria-hidden
                  />
                ) : null}
                <ImageWithFallback
                  className="relative z-10 h-full w-full object-cover transition-transform duration-300 group-hover:scale-[1.03]"
                  src={image.thumbSrc || image.fullSrc}
                  retrySrc={image.fullSrc}
                  alt={image.alt}
                  width={640}
                  height={640}
                  fallbackLabel="WORK"
                  fallbackSize={{ w: 640, h: 640 }}
                  sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 280px"
                  priority={index < 4}
                  onLoad={() => handleImageLoad(image.id)}
                />
              </button>
            );
          })}
        </div>
      ) : (
        <EmptyState
          type="images"
          showEditButton={false}
          title={isPublic ? ui.profile.galleryEmptyTitle : undefined}
          description={
            isPublic ? ui.profile.galleryEmptyDescription : undefined
          }
        />
      )}

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
};
