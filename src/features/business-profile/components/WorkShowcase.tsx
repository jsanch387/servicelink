'use client';

import { ImageWithFallback } from '@/components/shared/ImageWithFallback';
import React from 'react';
import { CompleteBusinessProfile, EditMode } from '../types/businessProfile';
import { EmptyState } from './EmptyState';

interface WorkShowcaseProps {
  businessProfile: CompleteBusinessProfile;
  editMode: EditMode;
  onSave: (data: Record<string, unknown>) => Promise<void>;
  onCancel: () => void;
}

export const WorkShowcase: React.FC<WorkShowcaseProps> = ({
  businessProfile,
  editMode: _editMode,
  onSave: _onSave,
  onCancel: _onCancel,
}) => {
  const images = businessProfile.images || [];
  const hasImages = images && images.length > 0;

  return (
    <section className="px-4 py-6 sm:px-8 sm:py-8">
      {hasImages ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {images.map((image, index) => (
            <div
              key={image.id || `image-${index}`}
              className="relative aspect-square bg-neutral-700 rounded-xl overflow-hidden group cursor-pointer"
            >
              <ImageWithFallback
                className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                src={
                  image.preview_url ||
                  `https://qailotbnrtwyzhbwufvk.supabase.co/storage/v1/object/public/business_images/${image.storage_path}`
                }
                alt="Portfolio image"
                width={600}
                height={600}
                fallbackLabel="WORK"
                fallbackSize={{ w: 600, h: 600 }}
              />
            </div>
          ))}
        </div>
      ) : (
        <EmptyState type="images" showEditButton={false} />
      )}
    </section>
  );
};
