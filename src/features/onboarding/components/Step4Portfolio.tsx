'use client';

import { Button } from '@/components/shared';
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
}> = memo(({ src, alt, onRemove }) => {
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
    <div className="relative group">
      {/* Responsive Container - Larger on bigger screens, optimized for mobile */}
      <div className="aspect-square w-full rounded-xl overflow-hidden shadow-lg bg-neutral-900 border border-neutral-700 hover:border-orange-400/50 transition-all duration-300 group-hover:shadow-2xl">
        {/* Subtle overlay for better visual feedback */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 z-10" />
        <Image
          src={src}
          alt={alt}
          width={600}
          height={600}
          sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 50vw"
          className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
          priority={false}
          loading="lazy"
          placeholder="blur"
          blurDataURL="data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAYEBQYFBAYGBQYHBwYIChAKCgkJChQODwwQFxQYGBcUFhYaHSUfGhsjHBYWICwgIyYnKSopGR8tMC0oMCUoKSj/2wBDAQcHBwoIChMKChMoGhYaKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCj/wAARCAABAAEDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAv/xAAUEAEAAAAAAAAAAAAAAAAAAAAA/8QAFQEBAQAAAAAAAAAAAAAAAAAAAAX/xAAUEQEAAAAAAAAAAAAAAAAAAAAA/9oADAMBAAIRAxEAPwCdABmX/9k="
          onError={e => {
            e.currentTarget.src =
              'https://placehold.co/600x600/374151/E5E7EB?text=No+Preview';
          }}
        />
      </div>

      {/* Enhanced Remove Button - Better touch targets */}
      <div className="absolute top-3 right-3">
        <button
          onClick={handleRemoveClick}
          className="p-2.5 bg-red-600/90 text-white rounded-full shadow-xl hover:bg-red-500 active:bg-red-700 transition duration-200 touch-manipulation backdrop-blur-sm border border-red-500/20"
          aria-label="Remove image"
        >
          <XMarkIcon className="h-5 w-5 sm:h-6 sm:w-6" />
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
        flex flex-col items-center justify-center w-full p-8 transition duration-300
        border-4 border-dashed rounded-xl cursor-pointer
        ${
          effectiveDisabled
            ? 'opacity-50 cursor-not-allowed border-neutral-700 bg-neutral-900'
            : dragActive
              ? 'border-orange-400 bg-orange-500/10'
              : 'border-orange-400/50 bg-neutral-900 hover:bg-neutral-900/70'
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
  existingData,
  onNext,
  onBack,
}) => {
  console.log('🎨 Step4Portfolio loaded:', {
    profileId,
    businessProfileId,
    existingData,
  });

  const [images, setImages] = useState<PortfolioImage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string>('');
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [removedImages, setRemovedImages] = useState<PortfolioImage[]>([]);

  // Use the portfolio upload hook
  const { uploadPortfolio, isUploading: isUploadingPortfolio } =
    useUploadPortfolio();

  // Load existing images from database
  useEffect(() => {
    const loadExistingImages = async () => {
      console.log('📝 Loading existing images from database...');

      const result =
        await BusinessImagesService.getImagesByBusinessId(businessProfileId);

      if (result.success && result.data) {
        console.log('✅ Loaded existing images:', result.data);

        // Convert database images to our format with proper preview URLs
        const dbImages: PortfolioImage[] = result.data.map(img => ({
          id: img.id,
          storage_path: img.storage_path,
          position: img.position,
          preview_url: `https://qailotbnrtwyzhbwufvk.supabase.co/storage/v1/object/public/business_images/${img.storage_path}`,
        }));

        setImages(dbImages);
      } else {
        console.log('ℹ️ No existing images found');
        // Don't reset images array here - preserve any local state from navigation
      }
    };

    loadExistingImages();
  }, [businessProfileId]);

  const handleImageSelect = (file: File) => {
    console.log('📸 Processing selected image:', file.name);

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

      console.log('➕ Adding image to portfolio:', newImage);
      setImages(prev => [...prev, newImage]);
      setSelectedFiles(prev => [...prev, file]);
      setError('');
    } catch (error) {
      console.error('Error processing image:', error);
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

  const convertHeicFiles = async (files: File[]): Promise<File[]> => {
    const convertedFiles: File[] = [];

    for (const file of files) {
      // Check if it's a HEIC file
      const isHeic =
        file.type === 'image/heic' ||
        file.type === 'image/heif' ||
        file.name.toLowerCase().endsWith('.heic') ||
        file.name.toLowerCase().endsWith('.heif');

      if (isHeic) {
        console.log('🔄 Converting HEIC file:', file.name);

        try {
          // Send HEIC file to server for conversion
          const formData = new FormData();
          formData.append('file', file);

          const response = await fetch('/api/convert-heic', {
            method: 'POST',
            body: formData,
          });

          if (!response.ok) {
            throw new Error(`HEIC conversion failed: ${response.statusText}`);
          }

          // Convert response to File object
          const blob = await response.blob();
          const convertedFile = new File(
            [blob],
            file.name.replace(/\.(heic|heif)$/i, '.jpg'),
            {
              type: 'image/jpeg',
              lastModified: file.lastModified,
            }
          );

          convertedFiles.push(convertedFile);
          console.log('✅ HEIC converted to JPEG:', convertedFile.name);
        } catch (error) {
          console.error('❌ HEIC conversion failed:', error);
          // Fallback: use original file (will fail on upload, but user gets error)
          convertedFiles.push(file);
        }
      } else {
        // Regular file, no conversion needed
        convertedFiles.push(file);
      }
    }

    return convertedFiles;
  };

  const removeImage = useCallback(
    (index: number) => {
      console.log('🗑️ Removing image at index:', index);

      const imageToRemove = images[index];

      // If it's an existing image (not a temp/preview), track it for deletion
      if (
        !imageToRemove.id?.toString().startsWith('temp-') &&
        imageToRemove.id
      ) {
        console.log('📝 Tracking existing image for deletion:', imageToRemove);
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

      // Only remove from selectedFiles if it's a temp image (newly added)
      if (imageToRemove.id?.toString().startsWith('temp-')) {
        setSelectedFiles(prev => prev.filter((_, i) => i !== index));
      }
    },
    [images]
  );

  const handleSubmit = async () => {
    console.log('💾 Saving Step 4 portfolio data:', images);

    setIsLoading(true);
    setError('');

    try {
      let newlyUploadedImages: PortfolioImage[] = [];

      // Step 0: Delete removed images from storage and database
      if (removedImages.length > 0) {
        console.log(
          '🗑️ STEP 0: Deleting removed images:',
          removedImages.length
        );

        // Delete from storage
        const storagePaths = removedImages.map(img => img.storage_path);
        const deleteStorageResult =
          await MediaService.deleteImages(storagePaths);

        if (!deleteStorageResult.success) {
          console.error(
            '❌ Failed to delete images from storage:',
            deleteStorageResult.error
          );
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
          console.error(
            '❌ Failed to delete some images from database:',
            failedDeletes
          );
          setError('Failed to delete some removed images. Please try again.');
          setIsLoading(false);
          return;
        }

        console.log('✅ STEP 0 COMPLETE: Removed images deleted successfully');

        // Clear the removed images array since they've been successfully deleted
        setRemovedImages([]);
      }

      // Step 1: Upload images to Supabase storage (if any new images)
      if (selectedFiles.length > 0) {
        console.log(
          '📤 STEP 1: Uploading portfolio images to storage:',
          selectedFiles.length
        );

        // Convert HEIC files to JPEG before uploading
        const convertedFiles = await convertHeicFiles(selectedFiles);
        console.log(
          '🔄 Converted files:',
          convertedFiles.map(f => f.name)
        );

        const uploadResult = await uploadPortfolio({
          businessId: businessProfileId,
          files: convertedFiles,
          previousImages: [], // No previous images for onboarding
        });

        console.log('📤 Upload result:', uploadResult);

        if (!uploadResult.every(r => r.success)) {
          const failedCount = uploadResult.filter(r => !r.success).length;
          setError(
            `${failedCount} of ${uploadResult.length} images failed to upload. Please try again.`
          );
          setIsLoading(false);
          return;
        }

        console.log(
          '✅ STEP 1 COMPLETE: Portfolio images uploaded successfully'
        );

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
              console.error('❌ Upload failed for image:', img);
              return null;
            }

            console.log(`🔄 Converting preview image ${index}:`, {
              from: img.storage_path,
              to: uploadResultItem.storagePath,
            });

            return {
              id: `uploaded-${Date.now()}-${index}`,
              storage_path: uploadResultItem.storagePath!,
              position: img.position,
              preview_url: uploadResultItem.publicUrl || img.preview_url,
            } as PortfolioImage;
          })
          .filter((img): img is PortfolioImage => img !== null);

        console.log(
          '🖼️ Uploaded images after conversion:',
          newlyUploadedImages
        );

        // Update images array with uploaded images
        const updatedImages = [...existingImages, ...newlyUploadedImages];
        setImages(updatedImages);
        setSelectedFiles([]);

        console.log(
          '✅ STEP 2 COMPLETE: Images updated with real storage paths'
        );
      }

      // Step 3: Save to business_images table
      console.log('💾 STEP 3: Saving images to business_images table...');

      if (newlyUploadedImages.length > 0) {
        const dbResult = await BusinessImagesService.createImagesForOnboarding(
          businessProfileId,
          newlyUploadedImages
        );

        if (!dbResult.success) {
          console.error(
            '❌ Failed to save images to database:',
            dbResult.error
          );
          setError(dbResult.error || 'Failed to save images to database');
          setIsLoading(false);
          return;
        }

        console.log('✅ STEP 3 COMPLETE: Images saved to database');
      }

      // Step 4: Update onboarding progress
      console.log('📝 STEP 4: Updating onboarding progress...');
      const progressResult = await saveStepAndProgress(
        profileId,
        4, // current step
        businessProfileId,
        {}, // No business profile data to update
        false // not skipping
      );

      if (!progressResult.success) {
        console.error('❌ Failed to update progress:', progressResult.error);
        setError(progressResult.error || 'Failed to update progress');
        setIsLoading(false);
        return;
      }

      console.log('✅ Step 4 saved successfully, moving to step 5');
      onNext();
    } catch (error) {
      console.error('❌ Error saving Step 4:', error);
      setError('Something went wrong. Please try again.');
      setIsLoading(false);
    }
  };

  const handleSkip = async () => {
    console.log('⏭️ User skipping Step 4');
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
        console.error('❌ Failed to skip Step 4:', result.error);
        setError(result.error || 'Failed to skip step');
        setIsLoading(false);
        return;
      }

      console.log('✅ Skipped Step 4, moving to step 5');
      onNext();
    } catch (error) {
      console.error('❌ Error skipping Step 4:', error);
      setError('Something went wrong. Please try again.');
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto sm:px-6 lg:px-8">
      {/* Header Section */}
      <div className="mb-10 sm:mb-12 text-center">
        <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-white mb-3 sm:mb-4 tracking-tight">
          Showcase Your <span className="text-orange-400">Best Work</span>
        </h1>
        <p className="text-lg sm:text-xl lg:text-2xl text-gray-400 leading-relaxed font-light max-w-3xl mx-auto">
          Upload photos to build instant credibility and trust with potential
          customers.
        </p>
      </div>

      {/* Error Message */}
      {error && (
        <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-4 mb-6 sm:mb-8 mx-2 sm:mx-0">
          <p className="text-red-400 text-sm font-medium text-center">
            {error}
          </p>
        </div>
      )}

      {/* Main Content Container */}
      <div className="bg-neutral-800 border-2 border-neutral-700 rounded-3xl p-6 sm:p-8 lg:p-10 shadow-2xl  sm:mx-0">
        {/* Upload Section */}
        <div className="mb-8 sm:mb-10">
          <h2 className="text-lg sm:text-xl lg:text-2xl font-bold text-white mb-6 sm:mb-8 text-left border-l-4 border-orange-400 pl-3 uppercase tracking-wider">
            Add Photos to Portfolio
          </h2>
          <EnhancedImageUpload
            onImageSelect={handleImageSelect}
            disabled={isLoading || isUploadingPortfolio}
            imageCount={images.length}
            maxImages={4}
          />
        </div>

        {/* Portfolio Grid */}
        {images.length > 0 && (
          <div className="pt-8 border-t border-neutral-700">
            <div className="mb-6 sm:mb-8">
              <h2 className="text-lg sm:text-xl lg:text-2xl font-bold text-white mb-2 text-left border-l-4 border-orange-400 pl-3 uppercase tracking-wider">
                Your Current Portfolio ({images.length}/4)
              </h2>
              <p className="text-sm text-gray-400 pl-7">
                {images.length === 0
                  ? 'Upload your best work to build credibility with customers'
                  : images.length === 4
                    ? "Perfect! You've reached the maximum for onboarding"
                    : `${4 - images.length} more image${4 - images.length === 1 ? '' : 's'} can be added`}
              </p>
            </div>

            {/* Responsive Grid Layout - Optimized for better preview visibility */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 xl:grid-cols-2 gap-6 sm:gap-8">
              {images.map((image, index) => (
                <SmartImagePreview
                  key={`${image.id || 'temp'}-${index}`}
                  src={image.preview_url || image.storage_path}
                  alt={`Portfolio image ${index + 1}`}
                  onRemove={() => removeImage(index)}
                />
              ))}
            </div>
          </div>
        )}

        {/* Enhanced Empty State */}
        {images.length === 0 && (
          <div className="pt-8 border-t border-neutral-700">
            <div className="bg-gradient-to-br from-neutral-900 to-neutral-800 border border-neutral-700 rounded-xl p-8 sm:p-12 text-center border-dashed hover:border-orange-400/30 transition-colors duration-300">
              <CameraIcon className="h-12 w-12 sm:h-16 sm:w-16 text-orange-400 mx-auto mb-4 sm:mb-6 opacity-60" />
              <p className="text-gray-400 mb-2 font-semibold text-lg sm:text-xl">
                Your portfolio is currently empty
              </p>
              <p className="text-sm sm:text-base text-gray-500 max-w-md mx-auto mb-4">
                Upload at least one high-quality photo to showcase your work and
                build trust with customers!
              </p>
              <div className="flex flex-wrap justify-center gap-2 text-xs text-gray-600">
                <span className="bg-neutral-800 px-3 py-1 rounded-full">
                  📱 iPhone photos supported
                </span>
                <span className="bg-neutral-800 px-3 py-1 rounded-full">
                  🖼️ Large previews
                </span>
                <span className="bg-neutral-800 px-3 py-1 rounded-full">
                  ✨ Auto-optimized
                </span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Action Buttons */}
      <div className="flex flex-col gap-4 pt-6 sm:pt-8 mt-8 sm:mt-10 px-4 sm:px-0">
        {/* Back Button */}
        <Button
          type="button"
          onClick={onBack}
          variant="secondary"
          className="w-full sm:w-auto px-6 sm:px-8 order-2 sm:order-1"
          disabled={isLoading || isUploadingPortfolio}
        >
          ← Back
        </Button>

        <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 order-1 sm:order-2">
          {/* Skip Button */}
          <Button
            type="button"
            onClick={handleSkip}
            variant="outline"
            className="w-full sm:flex-1 px-6 sm:px-8"
            disabled={isLoading || isUploadingPortfolio}
          >
            Skip for now
          </Button>

          {/* Continue Button */}
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

      <p className="text-sm sm:text-base text-gray-500 text-center mt-6 sm:mt-8 px-4 sm:px-0">
        Don&apos;t worry - you can always add, manage, and rearrange your photos
        later.
      </p>
    </div>
  );
};
