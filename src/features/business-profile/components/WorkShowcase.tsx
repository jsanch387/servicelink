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
    <section className="px-8 py-12 border-b border-neutral-700">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-white flex items-center gap-3">
          <CameraIcon className="h-6 w-6 text-orange-500" />
          Our Work
        </h2>
      </div>

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
