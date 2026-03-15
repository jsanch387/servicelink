'use client';

import { Button } from '@/components/shared';
import { ROUTES } from '@/constants/routes';
import { CompleteBusinessProfile } from '@/features/business-profile/types/businessProfile';
import { ImageFormData } from '@/features/business-profile/utils/editing/editingHelpers';
import {
  FREE_MAX_PORTFOLIO_IMAGES,
  PRO_MAX_PORTFOLIO_IMAGES,
} from '@/features/pricing/types';
// Server-side HEIC conversion - no client-side imports needed
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
  /** When true, show upgrade CTA when at image limit (free tier). */
  isFreeTier?: boolean;
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
      <div className="aspect-square w-full rounded-xl overflow-hidden border border-white/10 bg-white/[0.02]">
        <Image
          src={src}
          alt={alt}
          width={400}
          height={400}
          className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
          unoptimized={src.startsWith('http')}
          loading="lazy"
          decoding="async"
          sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 20vw"
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
          <div className="rounded-xl border border-white/10 bg-white/[0.06] p-4 mx-4 max-w-sm backdrop-blur-sm">
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
  maxCount: number;
}> = ({ onImageSelect, disabled, maxCount }) => {
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
        flex flex-col items-center justify-center w-full min-h-[120px] sm:min-h-[140px] p-5 sm:p-6 transition duration-200
        border-2 border-dashed rounded-xl cursor-pointer touch-manipulation
        ${
          disabled
            ? 'opacity-50 cursor-not-allowed border-white/10 bg-white/[0.02]'
            : dragActive
              ? 'border-white/30 bg-white/[0.04]'
              : 'border-white/10 bg-white/[0.02] hover:border-white/20 hover:bg-white/[0.04] active:bg-white/[0.06]'
        }
      `}
      htmlFor="portfolio-file-upload"
      onDragEnter={handleDrag}
      onDragLeave={handleDrag}
      onDragOver={handleDrag}
      onDrop={handleDrop}
    >
      <CameraIcon className="h-9 w-9 sm:h-10 sm:w-10 text-gray-400 mb-2 flex-shrink-0" />
      <p className="text-sm font-medium text-white">
        {dragActive ? 'Drop here' : 'Add photo'}
      </p>
      <p className="text-xs text-gray-500 mt-0.5">
        JPG, PNG · 10MB max · {maxCount} max
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
  isFreeTier = false,
}) => {
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const maxImages = isFreeTier
    ? FREE_MAX_PORTFOLIO_IMAGES
    : PRO_MAX_PORTFOLIO_IMAGES;

  const handleImageSelect = (file: File) => {
    // Validate limits and file type
    if (images.length >= maxImages) {
      alert(`Maximum of ${maxImages} images allowed`);
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      alert('File size too large (max 10MB)');
      return;
    }

    if (!file.type.startsWith('image/')) {
      alert('Please select an image file');
      return;
    }

    try {
      // Create appropriate preview based on file type
      let previewUrl: string;

      // Check if it's a HEIC file (iPhone photos)
      const isHeic =
        file.type === 'image/heic' ||
        file.type === 'image/heif' ||
        file.name.toLowerCase().endsWith('.heic') ||
        file.name.toLowerCase().endsWith('.heif');

      if (isHeic) {
        // HEIC files: Show professional placeholder (browsers can't display HEIC)
        previewUrl = createHeicPlaceholder(file.name);
      } else {
        // Regular images: Show actual preview
        previewUrl = URL.createObjectURL(file);
      }

      // Add to selected files for upload
      const newFiles = [...selectedFiles, file];
      setSelectedFiles(newFiles);
      onFilesChange(newFiles);

      // Create preview for immediate display
      const previewImage: ImageFormData = {
        id: `preview-${Date.now()}`,
        storage_path: '', // Will be set after upload
        position: images.length + 1,
        preview_url: previewUrl,
        file_type: file.type,
        original_type: file.type,
      };

      onImagesChange([...images, previewImage]);
    } catch (error) {
      console.error('Error processing image:', error);
      alert('Error processing image. Please try again.');
    }
  };

  const createHeicPlaceholder = (fileName: string): string => {
    const svg = `
      <svg width="400" height="400" xmlns="http://www.w3.org/2000/svg">
        <!-- Background matching app's neutral-900 -->
        <rect width="100%" height="100%" fill="#171717"/>

        <!-- Main container matching app's neutral-900 with neutral-700 border -->
        <rect x="40" y="40" width="320" height="320" fill="#171717" rx="16" stroke="#404040" stroke-width="1"/>

        <!-- Image icon in neutral colors -->
        <rect x="160" y="140" width="80" height="60" fill="#404040" rx="8"/>
        <rect x="170" y="150" width="60" height="40" fill="#525252" rx="4"/>
        <circle cx="200" cy="170" r="6" fill="#737373"/>

        <!-- File name in app's foreground color -->
        <text x="200" y="240" font-family="system-ui, -apple-system, sans-serif" font-size="16" font-weight="600" fill="#ededed" text-anchor="middle">${fileName}</text>

        <!-- Status message using app's neutral colors -->
        <rect x="50" y="270" width="300" height="60" fill="#262626" rx="12" stroke="#404040" stroke-width="1"/>
        <text x="200" y="295" font-family="system-ui, -apple-system, sans-serif" font-size="14" font-weight="500" fill="#a3a3a3" text-anchor="middle">Preview will show after saving</text>
        <text x="200" y="315" font-family="system-ui, -apple-system, sans-serif" font-size="12" fill="#a3a3a3" text-anchor="middle">Image will be converted to JPEG format</text>
      </svg>
    `;
    return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
  };

  const removeImage = (index: number) => {
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

  const hasReachedLimit = images.length >= maxImages;

  return (
    <div className="space-y-6">
      {/* Section Header - More Prominent */}
      <div className="mb-6">
        <h2 className="text-xl sm:text-2xl font-bold text-white tracking-tight mb-2">
          Portfolio Gallery
        </h2>
        <p className="text-sm sm:text-base text-gray-400">
          Showcase your best work with high-quality photos
          {hasReachedLimit && (
            <span className="text-gray-300 font-medium ml-2">
              (Maximum {maxImages} images reached)
            </span>
          )}
        </p>
      </div>

      {/* Upload Section */}
      {!hasReachedLimit && (
        <div className="mb-6">
          <EnhancedImageUpload
            onImageSelect={handleImageSelect}
            disabled={isLoading}
            maxCount={maxImages}
          />
        </div>
      )}

      {/* Maximum Limit Reached Message */}
      {hasReachedLimit && (
        <div className="mb-6 space-y-3">
          <div className="rounded-xl border border-white/10 bg-white/[0.04] p-4">
            <div className="flex items-start gap-3">
              <ExclamationTriangleIcon className="h-5 w-5 text-gray-400 flex-shrink-0 mt-0.5" />
              <p className="text-gray-400 text-sm">
                {isFreeTier && images.length > FREE_MAX_PORTFOLIO_IMAGES
                  ? `Customers see only your first ${FREE_MAX_PORTFOLIO_IMAGES} images on your public profile. Upgrade to show all ${images.length}.`
                  : `You've reached the maximum of ${maxImages} images.${isFreeTier ? ' Upgrade to add more.' : ' Remove an image to add a new one.'}`}
              </p>
            </div>
          </div>
          {isFreeTier && (
            <Button
              href={ROUTES.DASHBOARD.UPGRADE}
              variant="inverse"
              className="w-full sm:w-auto"
            >
              {images.length > FREE_MAX_PORTFOLIO_IMAGES
                ? 'Upgrade to show all images'
                : 'Upgrade to add more images'}
            </Button>
          )}
        </div>
      )}

      {/* Portfolio Grid */}
      {images.length > 0 && (
        <div className="space-y-4">
          <h3 className="text-sm sm:text-base font-semibold text-white flex items-center gap-2">
            Your Portfolio ({images.length}/{maxImages})
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
        <div className="rounded-xl border border-dashed border-white/10 bg-white/[0.04] p-8 text-center">
          <CameraIcon className="h-12 w-12 text-gray-400 mx-auto mb-4 opacity-60" />
          <p className="text-gray-400 mb-2 font-semibold">
            Your portfolio is currently empty
          </p>
          <p className="text-sm text-gray-500 max-w-md mx-auto">
            Upload at least one high-quality photo to showcase your work and
            build trust with customers!
          </p>
        </div>
      )}
    </div>
  );
};
