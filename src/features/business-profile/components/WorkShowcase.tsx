'use client';

import type { PublicBookingFlowLocale } from '@/constants/routes';
import { publicBookingUi } from '@/libs/i18n/publicBookingUi';
import React, { useMemo, useState } from 'react';
import { useProgressiveVisibleCount } from '../hooks/useProgressiveVisibleCount';
import { CompleteBusinessProfile, EditMode } from '../types/businessProfile';
import { GALLERY_PRIORITY_COUNT, toWorkPhotos } from '../utils/workPhotoSrc';
import { EmptyState } from './EmptyState';
import { WorkGalleryTile } from './work/WorkGalleryTile';
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
  const { visibleCount, sentinelRef } = useProgressiveVisibleCount(
    photos.length
  );
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  return (
    <section
      className="px-4 py-5 sm:px-8 sm:py-6"
      aria-label={ui.profile.galleryTab}
    >
      {photos.length > 0 ? (
        <>
          <div className="grid grid-cols-2 gap-1.5 sm:grid-cols-3 sm:gap-2">
            {photos.map((photo, index) => {
              const alt = ui.profile.workPhotoAlt(
                businessProfile.business_name,
                index + 1,
                photos.length
              );
              return (
                <WorkGalleryTile
                  key={photo.id}
                  photo={photo}
                  alt={alt}
                  shouldLoad={index < visibleCount}
                  priority={index < GALLERY_PRIORITY_COUNT}
                  onOpen={() => setOpenIndex(index)}
                />
              );
            })}
            {visibleCount < photos.length ? (
              <div
                ref={sentinelRef}
                className="col-span-full h-px"
                aria-hidden
              />
            ) : null}
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
