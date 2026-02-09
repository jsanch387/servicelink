'use client';

import { Button, GlassCard } from '@/components/shared';
import { MediaService } from '@/features/media';
import { useUploadPortfolio } from '@/features/media/useUploadPortfolio';
import { CameraIcon, XMarkIcon } from '@heroicons/react/24/outline';
import Image from 'next/image';
import React, { memo, useCallback, useEffect, useState } from 'react';
import { BusinessImagesService } from '../services/businessImagesService';
import { PortfolioImage } from '../types/portfolio';
import { saveStepAndProgress } from '../utils/onboardingHelpers';

interface Step4PortfolioProps {
  profileId: string;
  businessProfileId: string;
  existingData?: Record<string, unknown>;
  onNext: () => void;
  onBack: () => void;
}

// Smart Image Preview Component with Mobile-First Design
const SmartImagePreview: React.FC<{
  src: string;
  alt: string;
  onRemove: () => void;
  isDeleting?: boolean;
}> = memo(({ src, alt, onRemove, isDeleting = false }) => {
  const [showConfirmation, setShowConfirmation] = useState(false);

  const handleRemoveClick = () => {
    // Always show confirmation dialog for consistency
    setShowConfirmation(true);
  };

  const confirmRemove = () => {
    onRemove();
    setShowConfirmation(false);
  };

  return (
    <div className="relative">
      <div
        className={`aspect-square w-full rounded-xl overflow-hidden bg-white/[0.04] border border-white/10 transition-all duration-300 ${isDeleting ? 'opacity-50' : ''}`}
      >
        <Image
          src={src}
          alt={alt}
          width={600}
          height={600}
          sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 50vw"
          className="w-full h-full object-cover"
          priority={false}
          loading="lazy"
          placeholder="blur"
          blurDataURL="data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAYEBQYFBAYGBQYHBwYIChAKCgkJChQODwwQFxQYGBcUFhYaHSUfGhsjHBYWICwgIyYnKSopGR8tMC0oMCUoKSj/2wBDAQcHBwoIChMKChMoGhYaKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCj/wAARCAABAAEDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAv/xAAUEAEAAAAAAAAAAAAAAAAAAAAA/8QAFQEBAQAAAAAAAAAAAAAAAAAAAAX/xAAUEQEAAAAAAAAAAAAAAAAAAAAA/9oADAMBAAIRAxEAPwCdABmX/9k="
          onError={e => {
            e.currentTarget.src =
              'https://placehold.co/600x600/374151/E5E7EB?text=No+Preview';
          }}
        />

        {/* Loading overlay when deleting */}
        {isDeleting && (
          <div className="absolute inset-0 bg-black/60 flex items-center justify-center rounded-xl">
            <div className="text-center">
              <div className="w-8 h-8 border-2 border-white border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
              <p className="text-white text-sm font-medium">Removing...</p>
            </div>
          </div>
        )}
      </div>

      {/* Mobile-First Remove Button - Always visible, larger touch target */}
      <div className="absolute top-2 right-2">
        <button
          onClick={handleRemoveClick}
          className="p-3 bg-red-600/95 text-white rounded-full shadow-2xl active:bg-red-700 transition duration-200 touch-manipulation backdrop-blur-sm border-2 border-white/20 min-w-[44px] min-h-[44px] flex items-center justify-center"
          aria-label="Remove image"
        >
          <XMarkIcon className="h-6 w-6" />
        </button>
      </div>

      {showConfirmation && (
        <div className="absolute inset-0 bg-black/70 flex items-center justify-center rounded-xl z-20">
          <div className="bg-[var(--dashboard-bg)] border border-white/10 rounded-xl p-6 mx-4 max-w-sm w-full shadow-xl">
            <div className="text-center mb-6">
              <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <XMarkIcon className="h-6 w-6 text-red-600" />
              </div>
              <p className="text-white text-lg font-semibold mb-2">
                Remove this image?
              </p>
              <p className="text-gray-400 text-sm">
                This action cannot be undone
              </p>
            </div>
            <div className="flex flex-col gap-3">
              <button
                onClick={confirmRemove}
                className="w-full px-6 py-3 bg-red-600 text-white rounded-lg font-medium active:bg-red-700 transition duration-200 touch-manipulation"
              >
                Yes, Remove Image
              </button>
              <button
                onClick={() => setShowConfirmation(false)}
                className="w-full px-6 py-3 bg-white/10 text-white rounded-lg font-medium border border-white/10 hover:bg-white/15 transition-colors touch-manipulation"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
});

SmartImagePreview.displayName = 'SmartImagePreview';

// Enhanced Upload Component with Better UX
const EnhancedImageUpload: React.FC<{
  // eslint-disable-next-line no-unused-vars
  onImageSelect: (file: File) => void;
  disabled: boolean;
  imageCount: number;
  maxImages: number;
}> = ({ onImageSelect, disabled, imageCount, maxImages }) => {
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

  const isAtLimit = imageCount >= maxImages;
  const effectiveDisabled = disabled || isAtLimit;

  return (
    <label
      className={`
        flex flex-col items-center justify-center w-full p-8 transition-colors
        border-2 border-dashed rounded-xl cursor-pointer
        ${
          effectiveDisabled
            ? 'opacity-50 cursor-not-allowed border-white/10 bg-white/[0.02]'
            : dragActive
              ? 'border-orange-400 bg-orange-500/10'
              : 'border-orange-400/40 bg-white/[0.04] hover:border-orange-400/60 hover:bg-white/[0.06]'
        }
      `}
      htmlFor="file-upload"
      onDragEnter={handleDrag}
      onDragLeave={handleDrag}
      onDragOver={handleDrag}
      onDrop={handleDrop}
    >
      <CameraIcon
        className={`h-12 w-12 mb-4 ${isAtLimit ? 'text-gray-500' : 'text-orange-400'}`}
      />
      <p className="mb-2 text-lg text-white font-semibold">
        {isAtLimit
          ? `Maximum ${maxImages} images reached`
          : dragActive
            ? 'Drop your photo here'
            : 'Click to upload or drag & drop'}
      </p>
      <p className="text-sm text-gray-500 text-center max-w-xs">
        {isAtLimit ? (
          <>
            You&apos;ve reached the onboarding limit of {maxImages} images.
            <br />
            You can add more photos later in your profile settings.
          </>
        ) : (
          <>
            Any size works! We&apos;ll automatically make it look perfect.
            <br />
            JPG, PNG, HEIC up to 10MB • {imageCount}/{maxImages} images
            <br />
            <span className="text-orange-400 text-xs">
              📱 iPhone photos (HEIC) will show preview after saving
            </span>
          </>
        )}
      </p>
      <input
        id="file-upload"
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleFileChange}
        disabled={effectiveDisabled}
      />
    </label>
  );
};

export const Step4Portfolio: React.FC<Step4PortfolioProps> = ({
  profileId,
  businessProfileId,
  onNext,
  onBack,
}) => {
  const [images, setImages] = useState<PortfolioImage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string>('');
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [removedImages, setRemovedImages] = useState<PortfolioImage[]>([]);
  const [deletingImages, setDeletingImages] = useState<Set<string>>(new Set());

  // Use the portfolio upload hook
  const { uploadPortfolio, isUploading: isUploadingPortfolio } =
    useUploadPortfolio();

  // Load existing images from database
  useEffect(() => {
    const loadExistingImages = async () => {
      const result =
        await BusinessImagesService.getImagesByBusinessId(businessProfileId);

      if (result.success && result.data) {
        // Convert database images to our format with proper preview URLs
        const dbImages: PortfolioImage[] = result.data.map(img => ({
          id: img.id,
          storage_path: img.storage_path,
          position: img.position,
          preview_url: `https://qailotbnrtwyzhbwufvk.supabase.co/storage/v1/object/public/business_images/${img.storage_path}`,
        }));

        setImages(dbImages);
      } else {
        // Don't reset images array here - preserve any local state from navigation
      }
    };

    loadExistingImages();
  }, [businessProfileId]);

  const handleImageSelect = (file: File) => {
    // Check image limit for onboarding (4 images max)
    if (images.length >= 4) {
      setError(
        'You can upload up to 4 images during onboarding. You can add more later in your profile settings.'
      );
      return;
    }

    // Validate file size (10MB max)
    if (file.size > 10 * 1024 * 1024) {
      setError('File size must be less than 10MB');
      return;
    }

    // Validate file type
    if (!file.type.startsWith('image/')) {
      setError('Please select an image file');
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

      // Create temporary storage path for preview
      const tempStoragePath = `portfolio/${businessProfileId}/${Date.now()}-${file.name}`;

      const newImage: PortfolioImage = {
        id: `temp-${Date.now()}`,
        storage_path: tempStoragePath,
        position: images.length + 1,
        preview_url: previewUrl,
      };

      setImages(prev => [...prev, newImage]);
      setSelectedFiles(prev => [...prev, file]);
      setError('');
    } catch {
      setError('Error processing image. Please try again.');
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
        <text x="200" y="295" font-family="system-ui, -apple-system, sans-serif" font-size="14" font-weight="500" fill="#f97316" text-anchor="middle">Preview will show after saving</text>
        <text x="200" y="315" font-family="system-ui, -apple-system, sans-serif" font-size="12" fill="#a3a3a3" text-anchor="middle">Image will be converted to JPEG format</text>
      </svg>
    `;
    return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
  };

  const removeImage = useCallback(
    (index: number) => {
      const imageToRemove = images[index];

      // Show loading state for existing images
      if (
        !imageToRemove.id?.toString().startsWith('temp-') &&
        imageToRemove.id
      ) {
        setDeletingImages(prev => new Set(prev).add(imageToRemove.id!));
        setRemovedImages(prev => [...prev, imageToRemove]);
      }

      // Clean up preview URL for temporary images
      if (
        imageToRemove.preview_url &&
        imageToRemove.id?.toString().startsWith('temp-')
      ) {
        URL.revokeObjectURL(imageToRemove.preview_url);
      }

      // Remove from images array
      setImages(prev => prev.filter((_, i) => i !== index));

      // Fix: Remove from selectedFiles by finding the matching file
      if (imageToRemove.id?.toString().startsWith('temp-')) {
        setSelectedFiles(prev => {
          // Find the index of the file that corresponds to this image
          const tempImageIndex = images
            .slice(0, index)
            .filter(img => img.id?.toString().startsWith('temp-')).length;

          return prev.filter((_, i) => i !== tempImageIndex);
        });
      }
    },
    [images]
  );

  const handleSubmit = async () => {
    setIsLoading(true);
    setError('');

    try {
      let newlyUploadedImages: PortfolioImage[] = [];

      // Step 0: Delete removed images from storage and database
      if (removedImages.length > 0) {
        // Delete from storage
        const storagePaths = removedImages.map(img => img.storage_path);
        const deleteStorageResult =
          await MediaService.deleteImages(storagePaths);

        if (!deleteStorageResult.success) {
          setError('Failed to delete removed images. Please try again.');
          setIsLoading(false);
          return;
        }

        // Delete from database (using individual calls for now)
        const imageIds = removedImages
          .map(img => img.id)
          .filter(Boolean) as string[];
        const deletePromises = imageIds.map(imageId =>
          BusinessImagesService.deleteImage(imageId)
        );
        const deleteResults = await Promise.all(deletePromises);

        const failedDeletes = deleteResults.filter(result => !result.success);
        if (failedDeletes.length > 0) {
          setError('Failed to delete some removed images. Please try again.');
          setIsLoading(false);
          return;
        }

        // Clear the removed images array and deleting state since they've been successfully deleted
        setRemovedImages([]);
        setDeletingImages(new Set());
      }

      // Step 1: Upload images to Supabase storage (if any new images)
      if (selectedFiles.length > 0) {
        // HEIC conversion is now handled automatically by MediaStorage
        const uploadResult = await uploadPortfolio({
          businessId: businessProfileId,
          files: selectedFiles,
          previousImages: [], // No previous images for onboarding
        });

        if (!uploadResult.every(r => r.success)) {
          const failedCount = uploadResult.filter(r => !r.success).length;
          setError(
            `${failedCount} of ${uploadResult.length} images failed to upload. Please try again.`
          );
          setIsLoading(false);
          return;
        }

        // Step 2: Update images array with real storage paths
        const tempImages = images.filter(img =>
          img.id?.toString().startsWith('temp-')
        );
        const existingImages = images.filter(
          img => !img.id?.toString().startsWith('temp-')
        );

        // Map uploaded results to preview images
        newlyUploadedImages = tempImages
          .map((img, index) => {
            const uploadResultItem = uploadResult[index];
            if (!uploadResultItem || !uploadResultItem.success) {
              return null;
            }

            return {
              id: `uploaded-${Date.now()}-${index}`,
              storage_path: uploadResultItem.storagePath!,
              position: img.position,
              preview_url: uploadResultItem.publicUrl || img.preview_url,
            } as PortfolioImage;
          })
          .filter((img): img is PortfolioImage => img !== null);

        // Update images array with uploaded images
        const updatedImages = [...existingImages, ...newlyUploadedImages];
        setImages(updatedImages);
        setSelectedFiles([]);
      }

      // Step 3: Save to business_images table
      if (newlyUploadedImages.length > 0) {
        const dbResult = await BusinessImagesService.createImagesForOnboarding(
          businessProfileId,
          newlyUploadedImages
        );

        if (!dbResult.success) {
          setError(dbResult.error || 'Failed to save images to database');
          setIsLoading(false);
          return;
        }
      }

      // Step 4: Update onboarding progress
      const progressResult = await saveStepAndProgress(
        profileId,
        4, // current step
        businessProfileId,
        {}, // No business profile data to update
        false // not skipping
      );

      if (!progressResult.success) {
        setError(progressResult.error || 'Failed to update progress');
        setIsLoading(false);
        return;
      }

      onNext();
    } catch {
      setError('Something went wrong. Please try again.');
      setIsLoading(false);
    }
  };

  const handleSkip = async () => {
    setIsLoading(true);

    try {
      const result = await saveStepAndProgress(
        profileId,
        4, // current step
        businessProfileId,
        {},
        true // skipping
      );

      if (!result.success) {
        setError(result.error || 'Failed to skip step');
        setIsLoading(false);
        return;
      }

      onNext();
    } catch {
      setError('Something went wrong. Please try again.');
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto sm:px-6 lg:px-8">
      <div className="mb-8 sm:mb-10 text-center">
        <h1 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">
          Showcase Your <span className="text-orange-400">Best Work</span>
        </h1>
        <p className="text-sm text-gray-400 mt-2">
          Upload photos to build credibility with customers.
        </p>
      </div>

      <GlassCard
        padding="lg"
        rounded="rounded-2xl"
        blurColor="bg-orange-500"
        showBlur={true}
        className="mb-8 text-left"
      >
        {error && (
          <div className="rounded-xl bg-red-500/10 border border-red-500/20 px-4 py-3 mb-6 text-center">
            <p className="text-red-400 text-sm">{error}</p>
          </div>
        )}

        <div className="mb-8 sm:mb-10">
          <h2 className="text-base font-semibold text-white mb-6">
            Add Photos to Portfolio
          </h2>
          <EnhancedImageUpload
            onImageSelect={handleImageSelect}
            disabled={isLoading || isUploadingPortfolio}
            imageCount={images.length}
            maxImages={4}
          />
        </div>

        {images.length > 0 && (
          <div className="pt-8 border-t border-white/10">
            <div className="mb-6">
              <h2 className="text-base font-semibold text-white mb-1">
                Your Portfolio ({images.length}/4)
              </h2>
              <p className="text-sm text-gray-400">
                {images.length === 4
                  ? "You've reached the max for now."
                  : `${4 - images.length} more image${4 - images.length === 1 ? '' : 's'} can be added.`}
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 sm:gap-8">
              {images.map((image, index) => (
                <SmartImagePreview
                  key={`${image.id || 'temp'}-${index}`}
                  src={image.preview_url || image.storage_path}
                  alt={`Portfolio image ${index + 1}`}
                  onRemove={() => removeImage(index)}
                  isDeleting={image.id ? deletingImages.has(image.id) : false}
                />
              ))}
            </div>
          </div>
        )}

        {images.length === 0 && (
          <div className="pt-8 border-t border-white/10">
            <div className="rounded-xl border border-dashed border-white/10 bg-white/[0.02] p-8 sm:p-10 text-center">
              <CameraIcon className="h-12 w-12 sm:h-14 sm:w-14 text-orange-400 mx-auto mb-4 opacity-60" />
              <p className="text-gray-400 mb-1 font-semibold text-base sm:text-lg">
                No photos yet
              </p>
              <p className="text-sm text-gray-500 max-w-sm mx-auto">
                Upload a photo to showcase your work. You can add more later.
              </p>
              <div className="flex flex-wrap justify-center gap-2 mt-4 text-xs text-gray-500">
                <span className="bg-white/5 px-3 py-1 rounded-full border border-white/10">
                  iPhone (HEIC) supported
                </span>
                <span className="bg-white/5 px-3 py-1 rounded-full border border-white/10">
                  Up to 10MB each
                </span>
              </div>
            </div>
          </div>
        )}
      </GlassCard>

      <div className="flex flex-col gap-4 pt-6 sm:pt-8">
        <Button
          type="button"
          onClick={onBack}
          variant="secondary"
          className="w-full sm:w-auto px-8 order-2 sm:order-1"
          disabled={isLoading || isUploadingPortfolio}
        >
          ← Back
        </Button>

        <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 order-1 sm:order-2">
          <Button
            type="button"
            onClick={handleSkip}
            variant="outline"
            className="w-full sm:flex-1 px-6 sm:px-8"
            disabled={isLoading || isUploadingPortfolio}
          >
            Skip for now
          </Button>

          <Button
            type="button"
            onClick={handleSubmit}
            variant="primary"
            className="w-full sm:flex-1 px-6 sm:px-8"
            disabled={isLoading || isUploadingPortfolio}
            loading={isLoading || isUploadingPortfolio}
          >
            {isLoading || isUploadingPortfolio ? 'Saving...' : 'Continue'}
          </Button>
        </div>
      </div>

      <p className="text-xs text-gray-500 text-center mt-4">
        You can add or change photos later.
      </p>
    </div>
  );
};
