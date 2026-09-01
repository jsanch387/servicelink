'use client';

import type { PublicBookingFlowLocale } from '@/constants/routes';
import { ImageWithFallback } from '@/components/shared/ImageWithFallback';
import { publicBookingUi } from '@/libs/i18n/publicBookingUi';
import React, { useMemo, useState } from 'react';
import { CompleteBusinessProfile, EditMode } from '../types/businessProfile';
import { toWorkPhotos } from '../utils/workPhotoSrc';
import { EmptyState } from './EmptyState';
import { WorkPhotoLightbox } from './work/WorkPhotoLightbox';

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
  const photos = useMemo(
    () => toWorkPhotos(businessProfile.images),
    [businessProfile.images]
  );
  const [loadedIds, setLoadedIds] = useState<Set<string>>(new Set());
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  const handleImageLoad = React.useCallback((id: string) => {
    setLoadedIds(prev => new Set(prev).add(id));
  }, []);

  return (
    <section
      className="px-4 py-5 sm:px-8 sm:py-6"
      aria-label={ui.profile.galleryTab}
    >
      {photos.length > 0 ? (
        <>
          <div className="grid grid-cols-2 gap-1.5 sm:grid-cols-3 sm:gap-2">
            {photos.map((photo, index) => {
              const loaded = loadedIds.has(photo.id);
              return (
                <button
                  key={photo.id}
                  type="button"
                  onClick={() => setOpenIndex(index)}
                  className="group relative aspect-square overflow-hidden rounded-xl bg-zinc-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/50"
                  aria-label={ui.profile.workPhotoAlt(
                    businessProfile.business_name,
                    index + 1,
                    photos.length
                  )}
                >
                  {!loaded ? (
                    <div
                      className="absolute inset-0 skeleton-image rounded-xl"
                      aria-hidden
                    />
                  ) : null}
                  <ImageWithFallback
                    className="relative z-10 h-full w-full object-cover transition-transform duration-300 group-hover:scale-[1.03]"
                    src={photo.src}
                    alt={ui.profile.workPhotoAlt(
                      businessProfile.business_name,
                      index + 1,
                      photos.length
                    )}
                    width={600}
                    height={600}
                    fallbackLabel="WORK"
                    fallbackSize={{ w: 600, h: 600 }}
                    sizes="(max-width: 640px) 50vw, 33vw"
                    onLoad={() => handleImageLoad(photo.id)}
                  />
                </button>
              );
            })}
          </div>
          <WorkPhotoLightbox
            photos={photos}
            openIndex={openIndex}
            onClose={() => setOpenIndex(null)}
            businessName={businessProfile.business_name}
            bookingFlowLocale={bookingFlowLocale}
          />
        </>
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
    </section>
  );
};
