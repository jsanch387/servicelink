'use client';

import type { PublicBookingFlowLocale } from '@/constants/routes';
import { ImageWithFallback } from '@/components/shared/ImageWithFallback';
import { publicBookingUi } from '@/libs/i18n/publicBookingUi';
import React from 'react';
import { CompleteBusinessProfile, EditMode } from '../types/businessProfile';
import { EmptyState } from './EmptyState';

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
  const images = businessProfile.images || [];
  const hasImages = images && images.length > 0;
  const [loadedIds, setLoadedIds] = React.useState<Set<string>>(new Set());

  const handleImageLoad = React.useCallback((id: string) => {
    setLoadedIds(prev => new Set(prev).add(id));
  }, []);

  return (
    <section className="px-4 py-6 sm:px-8 sm:py-8">
      {hasImages ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {images.map((image, index) => {
            const id = image.id || `image-${index}`;
            const loaded = loadedIds.has(id);
            return (
              <div
                key={id}
                className="relative aspect-square rounded-xl overflow-hidden group cursor-pointer"
              >
                {/* Animated skeleton until image loads */}
                {!loaded && (
                  <div
                    className="absolute inset-0 skeleton-image rounded-xl"
                    aria-hidden
                  />
                )}
                <ImageWithFallback
                  className="relative z-10 w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                  src={
                    image.preview_url ||
                    `https://qailotbnrtwyzhbwufvk.supabase.co/storage/v1/object/public/business_images/${image.storage_path}`
                  }
                  alt="Portfolio image"
                  width={600}
                  height={600}
                  fallbackLabel="WORK"
                  fallbackSize={{ w: 600, h: 600 }}
                  sizes="(max-width: 768px) 100vw, 50vw"
                  onLoad={() => handleImageLoad(id)}
                />
              </div>
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
    </section>
  );
};
