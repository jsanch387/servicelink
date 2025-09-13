'use client';

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/shared';
import { CompleteBusinessProfile } from '../../types/businessProfile';
import { BusinessInfoSection } from './sections/BusinessInfoSection';
import { ContactSection } from './sections/ContactSection';
import { ServicesSection } from './sections/ServicesSection';
import { BannerSection } from './sections/BannerSection';
import { ProfileImageSection } from './sections/ProfileImageSection';
import { PortfolioSection } from './sections/PortfolioSection';
import {
  EditingFormData,
  ServiceFormData,
  ImageFormData,
  saveBusinessProfile,
  cleanupPreviewUrls,
} from '../../utils/editing/editingHelpers';
import { useUploadPortfolio } from '@/features/media/hooks';

interface EditBusinessProfileProps {
  businessProfile: CompleteBusinessProfile;
  onSave: (data: any) => Promise<void>;
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
    console.log('🔄 Form data images changed:', formData.images);
  }, [formData.images]);

  // Handle form input changes
  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors.length > 0) setErrors([]);
  };

  const handlePhoneCallChange = (value: string) => {
    setFormData(prev => {
      const newData = { ...prev, phone_number_call: value };
      if (prev.same_phone_for_both) {
        newData.phone_number_text = value;
      }
      return newData;
    });
    if (errors.length > 0) setErrors([]);
  };

  const handlePhoneTextChange = (value: string) => {
    setFormData(prev => {
      const newData = { ...prev, phone_number_text: value };
      if (prev.same_phone_for_both && value !== prev.phone_number_call) {
        newData.same_phone_for_both = false;
      }
      return newData;
    });
    if (errors.length > 0) setErrors([]);
  };

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

  const handleCoverImageChange = (file: File) => {
    console.log('📸 Cover image selected:', file.name);
    // TODO: Implement cover image upload to Supabase storage
    // For now, create a preview URL
    const previewUrl = URL.createObjectURL(file);
    // Update form data with new cover image URL
    setFormData(prev => ({
      ...prev,
      cover_image_url: previewUrl,
    }));
  };

  const handleLogoImageChange = (file: File) => {
    console.log('📸 Logo image selected:', file.name);
    // TODO: Implement logo image upload to Supabase storage
    // For now, create a preview URL
    const previewUrl = URL.createObjectURL(file);
    // Update form data with new logo URL
    setFormData(prev => ({
      ...prev,
      logo_url: previewUrl,
    }));
  };

  // Save all changes
  const handleSave = async () => {
    console.log('🚀 STARTING SAVE PROCESS');
    console.log('📊 Current form data images:', formData.images);
    console.log('📁 Selected files:', selectedFiles);

    setIsSaving(true);
    setErrors([]);

    try {
      let finalFormData = formData;

      // First, upload any pending portfolio images to storage
      if (selectedFiles.length > 0) {
        console.log(
          '📤 STEP 1: Uploading portfolio images to storage:',
          selectedFiles.length
        );

        const result = await uploadPortfolio({
          businessId: businessProfile.id,
          files: selectedFiles,
          previousImages: [], // No previous images for now
        });

        console.log('📤 Upload result:', result);

        if (result.every(r => r.success)) {
          console.log(
            '✅ STEP 1 COMPLETE: Portfolio images uploaded successfully'
          );

          // Update form data with real storage paths
          const previewImages = formData.images.filter(img =>
            img.id?.toString().startsWith('preview-')
          );
          const existingImages = formData.images.filter(
            img => !img.id?.toString().startsWith('preview-')
          );

          console.log('🖼️ Preview images to update:', previewImages);
          console.log('🖼️ Existing images to keep:', existingImages);

          // Map uploaded results to preview images
          const uploadedImages: ImageFormData[] = previewImages
            .map((img, index) => {
              const uploadResult = result[index];
              if (!uploadResult || !uploadResult.success) {
                console.error('❌ Upload failed for image:', img);
                return null;
              }

              console.log(`🔄 Converting preview image ${index}:`, {
                from: img.storage_path,
                to: uploadResult.storagePath,
              });

              return {
                storage_path: uploadResult.storagePath!,
                position: img.position,
                preview_url: uploadResult.publicUrl,
              } as ImageFormData;
            })
            .filter((img): img is ImageFormData => img !== null);

          console.log('🖼️ Uploaded images after conversion:', uploadedImages);

          // Update form data with uploaded images
          const updatedImages = [...existingImages, ...uploadedImages];
          console.log('🖼️ Final updated images array:', updatedImages);

          // Create updated form data
          finalFormData = { ...formData, images: updatedImages };
          setFormData(finalFormData);
          setSelectedFiles([]);

          console.log(
            '✅ STEP 2 COMPLETE: Form data updated with uploaded images'
          );
        } else {
          console.error('❌ Portfolio upload failed:', result);
          setErrors(['Failed to upload portfolio images. Please try again.']);
          return;
        }
      }

      // Save everything to database
      console.log('💾 STEP 3: Saving business profile to database...');
      console.log(
        '📊 Final form data before database save:',
        finalFormData.images
      );

      const result = await saveBusinessProfile(
        businessProfile.id,
        finalFormData
      );

      if (result.success) {
        console.log('✅ STEP 3 COMPLETE: Business profile saved successfully');
        console.log('🎉 SAVE PROCESS COMPLETE');
        
        // Show success state briefly, then switch to preview mode
        setErrors([]);
        // The parent component will handle switching to preview mode
        // by calling onSave with the updated data
        await onSave(finalFormData);
      } else {
        console.error('❌ Failed to save business profile:', result.error);
        setErrors([result.error || 'Failed to save business profile']);
      }
    } catch (error) {
      console.error('❌ Error saving business profile:', error);
      setErrors(['An unexpected error occurred while saving']);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-4">
      {/* Persistent Save Button */}
      <div className="sticky top-4 z-10 bg-neutral-900/90 backdrop-blur-sm border border-neutral-700 rounded-lg p-4">
        <div className="flex flex-col sm:flex-row gap-3">
          <Button
            onClick={onCancel}
            variant="secondary"
            className="flex-1"
            disabled={isAnyLoading}
          >
            Cancel
          </Button>
          <Button
            onClick={handleSave}
            variant="primary"
            className="flex-1"
            disabled={isAnyLoading}
            loading={isSaving}
          >
            {isSaving ? 'Saving...' : isUploadingPortfolio ? 'Uploading Images...' : 'Save All Changes'}
          </Button>
        </div>
      </div>

      {/* Cover Banner */}
      <BannerSection
        businessProfile={businessProfile}
        isLoading={isLoading}
        onCoverImageChange={handleCoverImageChange}
      />

      {/* Profile Image */}
      <ProfileImageSection
        businessProfile={businessProfile}
        isLoading={isLoading}
        onLogoImageChange={handleLogoImageChange}
      />

      {/* Business Information */}
      <BusinessInfoSection
        formData={formData}
        onInputChange={handleInputChange}
        errors={errors}
      />

      {/* Services */}
      <ServicesSection
        services={formData.services}
        onServicesChange={handleServicesChange}
        errors={errors}
      />

      {/* Contact Information */}
      <ContactSection
        formData={formData}
        onInputChange={handleInputChange}
        onSamePhoneChange={handleSamePhoneChange}
        errors={errors}
      />

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
        <div className="bg-red-500/10 border border-red-500/20 rounded-md p-4">
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
  );
};
