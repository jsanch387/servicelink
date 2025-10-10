'use client';

import { CompleteBusinessProfile } from '@/features/business-profile/types/businessProfile';
import { ImageFormData } from '@/features/business-profile/utils/editing/editingHelpers';
import {
  CameraIcon,
  ExclamationTriangleIcon,
  XMarkIcon,
} from '@heroicons/react/24/outline';
import Image from 'next/image';
import React, { useState } from 'react';

interface PortfolioSectionProps {
  images: ImageFormData[];
  onImagesChange: (images: ImageFormData[]) => void;
  onFilesChange: (files: File[]) => void;
  businessProfile: CompleteBusinessProfile;
  isLoading: boolean;
}

// Smart Image Preview Component with Mobile-First Design
const SmartImagePreview: React.FC<{
  src: string;
  alt: string;
  onRemove: () => void;
}> = ({ src, alt, onRemove }) => {
  const [showConfirmation, setShowConfirmation] = useState(false);

  const handleRemoveClick = () => {
    setShowConfirmation(true);
  };

  const confirmRemove = () => {
    onRemove();
    setShowConfirmation(false);
  };

  return (
    <div className="relative group">
      {/* Fixed Square Container - Always maintains consistent size */}
      <div className="aspect-square w-full rounded-xl overflow-hidden bg-neutral-900 border border-neutral-700">
        <Image
          src={src}
          alt={alt}
          width={400}
          height={400}
          className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
          onError={e => {
            e.currentTarget.src =
              'https://placehold.co/400x400/374151/E5E7EB?text=No+Preview';
          }}
        />
      </div>

      {/* Mobile-First Remove Button */}
      <div className="absolute top-2 right-2">
        <button
          onClick={handleRemoveClick}
          className="p-2 bg-red-600/90 text-white rounded-full hover:bg-red-500 active:bg-red-700 transition duration-200 touch-manipulation"
          aria-label="Remove image"
        >
          <XMarkIcon className="h-4 w-4 sm:h-5 sm:w-5" />
        </button>
      </div>

      {/* Confirmation Dialog */}
      {showConfirmation && (
        <div className="absolute inset-0 bg-black/60 flex items-center justify-center rounded-xl z-10">
          <div className="bg-neutral-800 border border-neutral-600 rounded-xl p-4 mx-4 max-w-sm">
            <p className="text-white text-center mb-4 text-sm">
              Remove this image?
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setShowConfirmation(false)}
                className="flex-1 px-4 py-2 bg-neutral-600 text-white rounded-lg text-sm font-medium hover:bg-neutral-500 transition duration-200"
              >
                Cancel
              </button>
              <button
                onClick={confirmRemove}
                className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg text-sm font-medium hover:bg-red-500 transition duration-200"
              >
                Remove
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// Enhanced Upload Component with Better UX
const EnhancedImageUpload: React.FC<{
  onImageSelect: (_file: File) => void;
  disabled: boolean;
}> = ({ onImageSelect, disabled }) => {
  const [dragActive, setDragActive] = useState(false);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      onImageSelect(file);
    }
    event.target.value = '';
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      onImageSelect(e.dataTransfer.files[0]);
    }
  };

  return (
    <label
      className={`
        flex flex-col items-center justify-center w-full p-8 transition duration-300
        border-4 border-dashed rounded-xl cursor-pointer
        ${
          disabled
            ? 'opacity-50 cursor-not-allowed border-neutral-700 bg-neutral-900'
            : dragActive
              ? 'border-orange-400 bg-orange-500/10'
              : 'border-orange-400/50 bg-neutral-900 hover:bg-neutral-900/70'
        }
      `}
      htmlFor="portfolio-file-upload"
      onDragEnter={handleDrag}
      onDragLeave={handleDrag}
      onDragOver={handleDrag}
      onDrop={handleDrop}
    >
      <CameraIcon className="h-12 w-12 text-orange-400 mb-4" />
      <p className="mb-2 text-lg text-white font-semibold">
        {dragActive ? 'Drop your photo here' : 'Click to upload or drag & drop'}
      </p>
      <p className="text-sm text-gray-500 text-center max-w-xs">
        Any size works! We&apos;ll automatically make it look perfect.
        <br />
        JPG, PNG up to 10MB • Maximum 4 images
      </p>
      <input
        id="portfolio-file-upload"
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleFileChange}
        disabled={disabled}
      />
    </label>
  );
};

export const PortfolioSection: React.FC<PortfolioSectionProps> = ({
  images,
  onImagesChange,
  onFilesChange,
  businessProfile,
  isLoading,
}) => {
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const MAX_IMAGES = 4;

  const handleImageSelect = (file: File) => {
    console.log('📸 Portfolio image selected:', file.name);

    // Check if we've reached the maximum number of images
    if (images.length >= MAX_IMAGES) {
      console.error(`❌ Maximum of ${MAX_IMAGES} images allowed`);
      return;
    }

    // Validate file size (10MB max)
    if (file.size > 10 * 1024 * 1024) {
      console.error('❌ File size too large:', file.size);
      return;
    }

    // Validate file type
    if (!file.type.startsWith('image/')) {
      console.error('❌ Invalid file type:', file.type);
      return;
    }

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

  const hasReachedLimit = images.length >= MAX_IMAGES;

  return (
    <div className="space-y-6 sm:space-y-8">
      {/* Section Header */}
      <div>
        <h2 className="text-lg sm:text-xl lg:text-2xl font-bold text-white mb-6 sm:mb-8 text-left border-l-4 border-orange-400 pl-3 uppercase tracking-wider">
          Portfolio Gallery
        </h2>
        <p className="text-sm sm:text-base text-gray-400 leading-relaxed">
          Showcase your best work with high-quality photos to build trust and
          credibility with customers.{' '}
          {hasReachedLimit && (
            <span className="text-orange-400 font-semibold">
              (Maximum {MAX_IMAGES} images reached)
            </span>
          )}
        </p>
      </div>

      {/* Upload Section */}
      {!hasReachedLimit && (
        <div className="mb-8 sm:mb-10">
          <EnhancedImageUpload
            onImageSelect={handleImageSelect}
            disabled={isLoading}
          />
        </div>
      )}

      {/* Maximum Limit Reached Message */}
      {hasReachedLimit && (
        <div className="mb-8 sm:mb-10 bg-neutral-900 border border-neutral-700 rounded-xl p-4 sm:p-5">
          <div className="flex items-start gap-3">
            <ExclamationTriangleIcon className="h-5 w-5 text-gray-400 flex-shrink-0 mt-0.5" />
            <p className="text-gray-400 text-sm sm:text-base">
              You&apos;ve reached the maximum of {MAX_IMAGES} images. Remove an
              image to add a new one.
            </p>
          </div>
        </div>
      )}

      {/* Portfolio Grid */}
      {images.length > 0 && (
        <div className="pt-8 border-t border-neutral-700">
          <h3 className="text-lg sm:text-xl font-bold text-white mb-6 sm:mb-8 text-left border-l-4 border-orange-400 pl-3 uppercase tracking-wider">
            Your Current Portfolio ({images.length}/{MAX_IMAGES})
          </h3>

          {/* Smart Grid Layout - Always square containers */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 sm:gap-6">
            {images.map((image, index) => (
              <SmartImagePreview
                key={image.id || index}
                src={
                  image.preview_url ||
                  (image.storage_path
                    ? `https://qailotbnrtwyzhbwufvk.supabase.co/storage/v1/object/public/business_images/${image.storage_path}`
                    : 'https://placehold.co/400x400/374151/E5E7EB?text=No+Preview')
                }
                alt={`Portfolio image ${index + 1}`}
                onRemove={() => removeImage(index)}
              />
            ))}
          </div>
        </div>
      )}

      {/* Empty State */}
      {images.length === 0 && (
        <div className="pt-8 border-t border-neutral-700">
          <div className="bg-neutral-900 border border-neutral-700 rounded-xl p-8 sm:p-12 text-center border-dashed">
            <CameraIcon className="h-12 w-12 sm:h-16 sm:w-16 text-orange-400 mx-auto mb-4 sm:mb-6 opacity-60" />
            <p className="text-gray-400 mb-2 font-semibold text-lg sm:text-xl">
              Your portfolio is currently empty
            </p>
            <p className="text-sm sm:text-base text-gray-500 max-w-md mx-auto">
              Upload at least one high-quality photo to showcase your work and
              build trust with customers!
            </p>
          </div>
        </div>
      )}
    </div>
  );
};
