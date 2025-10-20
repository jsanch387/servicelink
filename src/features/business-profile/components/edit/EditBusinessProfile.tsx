'use client';

import { Button } from '@/components/shared';
import { useUploadPortfolio } from '@/features/media/hooks';
import { EyeIcon } from '@heroicons/react/24/outline';
import React, { useEffect, useState } from 'react';
import { CompleteBusinessProfile } from '../../types/businessProfile';
import {
  EditingFormData,
  ImageFormData,
  ServiceFormData,
  cleanupPreviewUrls,
  saveBusinessProfile,
} from '../../utils/editing/editingHelpers';
import { BannerSection } from './sections/BannerSection';
import { BusinessInfoSection } from './sections/BusinessInfoSection';
import { ContactSection } from './sections/ContactSection';
import { PortfolioSection } from './sections/PortfolioSection';
import { ProfileImageSection } from './sections/ProfileImageSection';
import { ServicesSection } from './sections/ServicesSection';

/**
 * HEIC Conversion for MVP
 *
 * Converts HEIC files (iPhone photos) to JPEG before upload.
 * This ensures compatibility across all browsers and platforms.
 *
 * Process:
 * 1. User selects HEIC file → Shows professional placeholder preview
 * 2. User clicks Save → HEIC files converted to JPEG on server
 * 3. JPEG files uploaded to Supabase → Works everywhere
 */
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
      try {
        // Send HEIC file to server for conversion
        const formData = new FormData();
        formData.append('file', file);

        const response = await fetch('/api/convert-heic', {
          method: 'POST',
          body: formData,
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || 'HEIC conversion failed');
        }

        // Get converted JPEG blob
        const jpegBlob = await response.blob();

        // Create new File object with JPEG extension
        const convertedFile = new File(
          [jpegBlob],
          file.name.replace(/\.(heic|heif)$/i, '.jpg'),
          { type: 'image/jpeg' }
        );

        convertedFiles.push(convertedFile);
      } catch {
        // If conversion fails, keep the original file
        convertedFiles.push(file);
      }
    } else {
      // Not a HEIC file, keep as is
      convertedFiles.push(file);
    }
  }

  return convertedFiles;
};

interface EditBusinessProfileProps {
  businessProfile: CompleteBusinessProfile;
  onSave: (data: Record<string, unknown>) => Promise<void>;
  onCancel: () => void;
  isLoading: boolean;
}

export const EditBusinessProfile: React.FC<EditBusinessProfileProps> = ({
  businessProfile,
  onSave,
  onCancel,
  isLoading,
}) => {
  // Form state
  const [formData, setFormData] = useState<EditingFormData>({
    business_name: businessProfile.business_name || '',
    business_type: businessProfile.business_type || '',
    service_area: businessProfile.service_area || '',
    bio: businessProfile.bio || '',
    phone_number_call: businessProfile.phone_number_call || '',
    phone_number_text: businessProfile.phone_number_text || '',
    same_phone_for_both:
      businessProfile.phone_number_call === businessProfile.phone_number_text &&
      (businessProfile.phone_number_call?.length || 0) > 0,
    logo_path: businessProfile.logo_path || '',
    banner_path: businessProfile.banner_path || '',
    services:
      businessProfile.services?.map(service => ({
        id: service.id,
        name: service.name,
        description: service.description || '',
        price: service.price_cents
          ? (service.price_cents / 100).toString()
          : '',
        hours_to_complete: service.hours_to_complete || null,
        isEditing: false,
      })) || [],
    images:
      businessProfile.images?.map(image => ({
        id: image.id,
        storage_path: image.storage_path,
        position: image.position,
      })) || [],
  });

  const [errors, setErrors] = useState<string[]>([]);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [isSaving, setIsSaving] = useState(false);
  const { uploadPortfolio, isUploading: isUploadingPortfolio } =
    useUploadPortfolio();

  // Combined loading state
  const isAnyLoading = isLoading || isSaving || isUploadingPortfolio;

  // Cleanup preview URLs on unmount
  useEffect(() => {
    return () => {
      cleanupPreviewUrls(formData.images);
    };
  }, [formData.images]);

  // Debug form data changes
  useEffect(() => {
    // Form data images changed
  }, [formData.images]);

  // Handle form input changes
  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors.length > 0) setErrors([]);
  };

  // const handlePhoneCallChange = (value: string) => {
  //   setFormData(prev => {
  //     const newData = { ...prev, phone_number_call: value };
  //     if (prev.same_phone_for_both) {
  //       newData.phone_number_text = value;
  //     }
  //     return newData;
  //   });
  //   if (errors.length > 0) setErrors([]);
  // };

  // const handlePhoneTextChange = (value: string) => {
  //   setFormData(prev => {
  //     const newData = { ...prev, phone_number_text: value };
  //     if (prev.same_phone_for_both && value !== prev.phone_number_call) {
  //       newData.same_phone_for_both = false;
  //     }
  //     return newData;
  //   });
  //   if (errors.length > 0) setErrors([]);
  // };

  const handleSamePhoneChange = (checked: boolean) => {
    setFormData(prev => {
      const newData = { ...prev, same_phone_for_both: checked };
      if (checked && prev.phone_number_call) {
        newData.phone_number_text = prev.phone_number_call;
      }
      return newData;
    });
  };

  const handleServicesChange = (services: ServiceFormData[]) => {
    setFormData(prev => ({ ...prev, services }));
  };

  const handleImagesChange = (images: ImageFormData[]) => {
    setFormData(prev => ({ ...prev, images }));
  };

  const handleFilesChange = (files: File[]) => {
    setSelectedFiles(files);
  };

  const handleCoverImageChange = (
    file: File,
    publicUrl?: string,
    storagePath?: string
  ) => {
    // If we have a public URL from successful upload, use that
    // Otherwise, create a preview URL for immediate display
    const bannerUrl = publicUrl || URL.createObjectURL(file);

    // Update form data with new cover image URL and storage path
    setFormData(prev => ({
      ...prev,
      cover_image_url: bannerUrl,
      banner_path: storagePath || prev.banner_path,
    }));

    // If we have a successful upload with public URL, immediately update the parent businessProfile
    // This ensures the cover photo shows immediately when switching to preview mode
    if (publicUrl && storagePath) {
      // Call the parent's onSave callback with just the cover photo updates
      onSave({
        cover_image_url: bannerUrl,
        banner_path: storagePath,
      });
    }
  };

  const handleLogoImageChange = (
    file: File,
    publicUrl?: string,
    storagePath?: string
  ) => {
    // If we have a public URL from successful upload, use that
    // Otherwise, create a preview URL for immediate display
    const logoUrl = publicUrl || URL.createObjectURL(file);

    // Update form data with new logo URL and storage path
    setFormData(prev => ({
      ...prev,
      logo_url: logoUrl,
      logo_path: storagePath || prev.logo_path,
    }));

    // If we have a successful upload with public URL, immediately update the parent businessProfile
    // This ensures the logo shows immediately when switching to preview mode
    if (publicUrl && storagePath) {
      // Call the parent's onSave callback with just the logo updates
      onSave({
        logo_url: logoUrl,
        logo_path: storagePath,
      });
    }
  };

  // Save all changes
  const handleSave = async () => {
    setIsSaving(true);
    setErrors([]);

    try {
      let finalFormData = formData;

      // First, upload any pending portfolio images to storage
      if (selectedFiles.length > 0) {
        // Convert HEIC files to JPEG before uploading
        const convertedFiles = await convertHeicFiles(selectedFiles);

        const result = await uploadPortfolio({
          businessId: businessProfile.id,
          files: convertedFiles,
          previousImages: [], // No previous images for now
        });

        if (result.every(r => r.success)) {
          // Update form data with real storage paths
          const previewImages = formData.images.filter(img =>
            img.id?.toString().startsWith('preview-')
          );
          const existingImages = formData.images.filter(
            img => !img.id?.toString().startsWith('preview-')
          );

          // Map uploaded results to preview images
          const uploadedImages: ImageFormData[] = previewImages
            .map((img, index) => {
              const uploadResult = result[index];
              if (!uploadResult || !uploadResult.success) {
                return null;
              }

              return {
                storage_path: uploadResult.storagePath!,
                position: img.position,
                preview_url: uploadResult.publicUrl,
              } as ImageFormData;
            })
            .filter((img): img is ImageFormData => img !== null);

          // Update form data with uploaded images
          const updatedImages = [...existingImages, ...uploadedImages];

          // Create updated form data
          finalFormData = { ...formData, images: updatedImages };
          setFormData(finalFormData);
          setSelectedFiles([]);
        } else {
          setErrors(['Failed to upload portfolio images. Please try again.']);
          return;
        }
      }

      // Save everything to database
      const result = await saveBusinessProfile(
        businessProfile.id,
        finalFormData
      );

      if (result.success) {
        // Show success state briefly, then switch to preview mode
        setErrors([]);
        // The parent component will handle switching to preview mode
        // by calling onSave with the updated data
        await onSave(finalFormData as unknown as Record<string, unknown>);
      } else {
        setErrors([result.error || 'Failed to save business profile']);
      }
    } catch {
      setErrors(['An unexpected error occurred while saving']);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-neutral-900 pb-8">
      {/* Action Bar - Above all content */}
      <div className="sticky top-20 z-30 max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 mb-6">
        <div className="bg-neutral-800/95 backdrop-blur-lg border border-neutral-700 rounded-xl px-4 py-3 shadow-2xl">
          <div className="flex gap-3">
            {/* Preview Button */}
            <Button
              onClick={onCancel}
              variant="secondary"
              className="flex-1 flex items-center justify-center gap-2 rounded-lg"
              disabled={isAnyLoading}
            >
              <EyeIcon className="h-4 w-4" />
              <span className="sm:hidden">Preview</span>
              <span className="hidden sm:inline">Preview</span>
            </Button>

            {/* Save Button */}
            <Button
              onClick={handleSave}
              variant="primary"
              className="flex-1 rounded-lg font-semibold"
              disabled={isAnyLoading}
              loading={isSaving}
            >
              {isSaving
                ? 'Saving...'
                : isUploadingPortfolio
                  ? 'Uploading...'
                  : 'Save Changes'}
            </Button>
          </div>
        </div>
      </div>

      {/* Content Sections */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 pt-16 lg:pt-20">
        {/* Cover Banner */}
        <BannerSection
          businessProfile={{
            ...businessProfile,
            cover_image_url:
              formData.cover_image_url || businessProfile.cover_image_url,
            banner_path: formData.banner_path || businessProfile.banner_path,
          }}
          isLoading={isLoading}
          onCoverImageChange={handleCoverImageChange}
        />

        {/* Divider */}
        <div className="border-t border-neutral-700 my-8 sm:my-12"></div>

        {/* Profile Image */}
        <ProfileImageSection
          businessProfile={{
            ...businessProfile,
            logo_url: formData.logo_url || businessProfile.logo_url,
            logo_path: formData.logo_path || businessProfile.logo_path,
          }}
          isLoading={isLoading}
          onLogoImageChange={handleLogoImageChange}
        />

        {/* Divider */}
        <div className="border-t border-neutral-700 my-8 sm:my-12"></div>

        {/* Business Information */}
        <BusinessInfoSection
          formData={formData}
          onInputChange={handleInputChange}
          errors={errors}
        />

        {/* Divider */}
        <div className="border-t border-neutral-700 my-8 sm:my-12"></div>

        {/* Services */}
        <ServicesSection
          services={formData.services}
          onServicesChange={handleServicesChange}
        />

        {/* Divider */}
        <div className="border-t border-neutral-700 my-8 sm:my-12"></div>

        {/* Contact Information */}
        <ContactSection
          formData={formData}
          onInputChange={handleInputChange}
          onSamePhoneChange={handleSamePhoneChange}
          errors={errors}
        />

        {/* Divider */}
        <div className="border-t border-neutral-700 my-8 sm:my-12"></div>

        {/* Portfolio */}
        <PortfolioSection
          images={formData.images}
          onImagesChange={handleImagesChange}
          onFilesChange={handleFilesChange}
          businessProfile={businessProfile}
          isLoading={isLoading}
        />

        {/* Error Messages */}
        {errors.length > 0 && (
          <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-4">
            <h4 className="text-red-400 font-medium mb-2">
              Please fix the following errors:
            </h4>
            <ul className="text-red-400 text-sm space-y-1">
              {errors.map((error, index) => (
                <li key={index}>• {error}</li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </div>
  );
};
