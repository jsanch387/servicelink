'use client';

import React, { useState, useEffect } from 'react';
import { Button, ImageUpload, ImagePreview } from '@/components/shared';
import { BusinessImagesService } from '../services/businessImagesService';
import { PortfolioImage } from '../types/portfolio';
import { saveStepAndProgress } from '../utils/onboardingHelpers';

interface Step4PortfolioProps {
  profileId: string;
  businessProfileId: string;
  existingData?: any;
  onNext: () => void;
  onBack: () => void;
}

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

  // Load existing images from database
  useEffect(() => {
    const loadExistingImages = async () => {
      console.log('📝 Loading existing images from database...');

      const result =
        await BusinessImagesService.getImagesByBusinessId(businessProfileId);

      if (result.success && result.data) {
        console.log('✅ Loaded existing images:', result.data);
        setImages(result.data);
      } else {
        console.log('ℹ️ No existing images found');
      }
    };

    loadExistingImages();
  }, [businessProfileId]);

  const handleImageSelect = (file: File) => {
    console.log('📸 Processing selected image:', file.name);

    // Create preview URL for immediate display
    const previewUrl = URL.createObjectURL(file);

    // Create mock storage path (will be replaced with actual Supabase storage)
    const mockStoragePath = `portfolio/${businessProfileId}/${Date.now()}-${file.name}`;

    const newImage: PortfolioImage = {
      id: `temp-${Date.now()}`,
      storage_path: mockStoragePath,
      position: images.length + 1,
      preview_url: previewUrl,
    };

    console.log('➕ Adding image to portfolio:', newImage);
    setImages(prev => [...prev, newImage]);
    setError('');
  };

  const removeImage = (index: number) => {
    console.log('🗑️ Removing image at index:', index);

    // Clean up preview URL to prevent memory leaks
    const imageToRemove = images[index];
    if (imageToRemove.preview_url) {
      URL.revokeObjectURL(imageToRemove.preview_url);
    }

    setImages(prev => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    console.log('💾 Saving Step 4 portfolio data:', images);

    setIsLoading(true);
    setError('');

    try {
      // Mock functionality - log what would be saved
      console.log('📦 MOCK: Would save images to business_images table:');
      images.forEach((image, index) => {
        console.log(`  Image ${index + 1}:`, {
          business_id: businessProfileId,
          storage_path: image.storage_path,
          position: image.position,
          preview_url: image.preview_url,
        });
      });

      // TODO: Replace with actual database save when Supabase storage is set up
      // const imagesResult = await BusinessImagesService.createImagesForOnboarding(
      //   businessProfileId,
      //   images
      // );

      // For now, simulate successful save
      console.log('✅ MOCK: Images would be saved successfully');

      // Update onboarding progress
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
    <div className="max-w-4xl mx-auto">
      <div className="mb-8 text-center">
        <h1 className="text-3xl font-bold text-white mb-4">
          Showcase your work
        </h1>
        <p className="text-xl text-gray-300">
          Upload photos of your best work to build trust with customers.
        </p>
        <p className="text-sm text-gray-400 mt-2">
          Instagram-size photos work great (1080x1080)
        </p>
      </div>

      {error && (
        <div className="bg-red-500/10 border border-red-500/20 rounded-md p-3 mb-6">
          <p className="text-red-400 text-sm">{error}</p>
        </div>
      )}

      <div className="space-y-8">
        {/* Upload Area */}
        <div className="bg-neutral-800 border border-neutral-700 rounded-lg p-6">
          <h2 className="text-xl font-semibold text-white mb-6">Add Photos</h2>
          <ImageUpload onImageSelect={handleImageSelect} disabled={isLoading} />
        </div>

        {/* Images Grid */}
        {images.length > 0 && (
          <div className="space-y-4">
            <h2 className="text-xl font-semibold text-white">
              Your Portfolio ({images.length})
            </h2>

            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {images.map((image, index) => (
                <ImagePreview
                  key={image.id || index}
                  src={image.preview_url || image.storage_path}
                  alt={`Portfolio image ${index + 1}`}
                  onRemove={() => removeImage(index)}
                />
              ))}
            </div>
          </div>
        )}

        {/* Empty State */}
        {images.length === 0 && (
          <div className="bg-neutral-800 border border-neutral-700 rounded-lg p-8 text-center">
            <p className="text-gray-400 mb-4">No photos added yet</p>
            <p className="text-sm text-gray-500">
              Upload your first photo using the upload area above
            </p>
          </div>
        )}
      </div>

      {/* Action Buttons */}
      <div className="flex flex-col sm:flex-row gap-4 pt-8 mt-8 border-t border-neutral-700">
        <Button
          onClick={onBack}
          variant="secondary"
          className="sm:w-auto"
          disabled={isLoading}
        >
          Back
        </Button>

        <div className="flex gap-4 flex-1">
          <Button
            onClick={handleSkip}
            variant="outline"
            className="flex-1"
            disabled={isLoading}
          >
            Skip for now
          </Button>

          <Button
            onClick={() => handleSubmit({} as React.FormEvent)}
            variant="primary"
            className="flex-1"
            disabled={isLoading}
            loading={isLoading}
          >
            {isLoading ? 'Saving...' : 'Continue'}
          </Button>
        </div>
      </div>

      <p className="text-sm text-gray-400 text-center mt-6">
        You can always add more photos later from your dashboard
      </p>
    </div>
  );
};
