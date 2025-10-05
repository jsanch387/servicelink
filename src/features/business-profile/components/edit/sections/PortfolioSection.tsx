'use client';

import { ImageUpload, ImageWithFallback } from '@/components/shared';
import { CompleteBusinessProfile } from '@/features/business-profile/types/businessProfile';
import { ImageFormData } from '@/features/business-profile/utils/editing/editingHelpers';
import React, { useState } from 'react';

interface PortfolioSectionProps {
  images: ImageFormData[];
  onImagesChange: (images: ImageFormData[]) => void;
  onFilesChange: (files: File[]) => void;
  businessProfile: CompleteBusinessProfile;
  isLoading: boolean;
}

export const PortfolioSection: React.FC<PortfolioSectionProps> = ({
  images,
  onImagesChange,
  onFilesChange,
  businessProfile,
  isLoading,
}) => {
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);

  const handleImageSelect = (file: File) => {
    console.log('📸 Portfolio image selected:', file.name);

    // Create preview URL for immediate display
    const previewUrl = URL.createObjectURL(file);

    // Add file to selected files for later upload
    const newFiles = [...selectedFiles, file];
    setSelectedFiles(newFiles);
    onFilesChange(newFiles);

    // Create preview image for immediate UI display
    const previewImage: ImageFormData = {
      id: `preview-${Date.now()}`,
      storage_path: '', // Will be set after upload
      position: images.length + 1,
      preview_url: previewUrl,
    };

    console.log('➕ Adding image preview:', previewImage);
    onImagesChange([...images, previewImage]);
  };

  const removeImage = (index: number) => {
    console.log('🗑️ Removing portfolio image at index:', index);

    const imageToRemove = images[index];

    // If it's a preview image, remove from selected files
    if (imageToRemove.id?.toString().startsWith('preview-')) {
      const previewIndex = images
        .filter(img => img.id?.toString().startsWith('preview-'))
        .indexOf(imageToRemove);
      if (previewIndex >= 0) {
        const newFiles = selectedFiles.filter((_, i) => i !== previewIndex);
        setSelectedFiles(newFiles);
        onFilesChange(newFiles);
      }
    }

    // Clean up preview URL to prevent memory leaks
    if (imageToRemove.preview_url) {
      URL.revokeObjectURL(imageToRemove.preview_url);
    }

    // Remove from images list
    onImagesChange(images.filter((_, i) => i !== index));
  };

  return (
    <div className="bg-neutral-800 rounded-lg p-4">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-white">Portfolio</h3>
        <span className="text-sm text-neutral-400">
          {images.length} image{images.length !== 1 ? 's' : ''}
        </span>
      </div>

      {/* Upload Area */}
      <div className="mb-6">
        <ImageUpload onImageSelect={handleImageSelect} disabled={isLoading} />
      </div>

      {/* Images Grid */}
      {images.length > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {images.map((image, index) => (
            <div key={image.id || index} className="relative group">
              <div className="aspect-square rounded-lg overflow-hidden bg-neutral-700">
                <ImageWithFallback
                  src={
                    image.preview_url ||
                    (image.storage_path
                      ? `https://qailotbnrtwyzhbwufvk.supabase.co/storage/v1/object/public/business_images/${image.storage_path}`
                      : undefined)
                  }
                  alt={`Portfolio image ${index + 1}`}
                  width={200}
                  height={200}
                  className="w-full h-full object-cover"
                />
              </div>

              {/* Remove Button */}
              <button
                onClick={() => removeImage(index)}
                className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 hover:bg-red-600 text-white rounded-full flex items-center justify-center text-sm opacity-0 group-hover:opacity-100 transition-opacity"
                disabled={isLoading}
              >
                ×
              </button>
            </div>
          ))}
        </div>
      )}

      {images.length === 0 && (
        <div className="text-center py-8 text-neutral-400">
          <p>
            No portfolio images yet. Upload some images to showcase your work.
          </p>
        </div>
      )}
    </div>
  );
};
