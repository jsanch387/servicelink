'use client';

import React from 'react';
import { CameraIcon } from '@heroicons/react/24/solid';
import { ImageWithFallback } from '@/components/shared/ImageWithFallback';
import { SectionTitle } from '@/components/shared/SectionTitle';
import { EmptyState } from './EmptyState';
import { CompleteBusinessProfile, EditMode } from '../types/businessProfile';

interface WorkShowcaseProps {
  businessProfile: CompleteBusinessProfile;
  editMode: EditMode;
  onSave: (data: any) => Promise<void>;
  onCancel: () => void;
}

export const WorkShowcase: React.FC<WorkShowcaseProps> = ({
  businessProfile,
  editMode,
  onSave,
  onCancel,
}) => {
  const images = businessProfile.images || [];
  const hasImages = images && images.length > 0;

  return (
    <section className="px-6 py-8 sm:px-8 bg-neutral-800">
      <SectionTitle icon={<CameraIcon className="h-7 w-7 text-gray-50" />}>
        Our Work
      </SectionTitle>

      {hasImages ? (
        <>
          <style jsx>{`
            .custom-scrollbar::-webkit-scrollbar {
              display: none;
            }
            .custom-scrollbar {
              -ms-overflow-style: none;
              scrollbar-width: none;
            }
          `}</style>
          <div className="flex overflow-x-auto snap-x snap-mandatory space-x-4 pb-4 custom-scrollbar">
            {images.map((image, index) => (
              <div
                key={image.id || `image-${index}`}
                className="flex-none w-[85%] snap-center md:w-[48%] lg:w-[31%] bg-neutral-700 rounded-lg shadow-md overflow-hidden transform transition duration-300 hover:scale-105"
              >
                <ImageWithFallback
                  className="w-full h-[28rem] object-cover"
                  src={
                    image.preview_url ||
                    `https://qailotbnrtwyzhbwufvk.supabase.co/storage/v1/object/public/business_images/${image.storage_path}`
                  }
                  alt="Portfolio image"
                  fallbackLabel="WORK"
                  fallbackSize={{ w: 900, h: 1400 }}
                />
              </div>
            ))}
          </div>
        </>
      ) : (
        <EmptyState type="images" showEditButton={false} />
      )}
    </section>
  );
};
