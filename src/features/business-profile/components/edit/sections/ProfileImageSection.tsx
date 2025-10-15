/* eslint-disable no-unused-vars */
'use client';

import { Button, Modal } from '@/components/shared';
import { useUploadLogo } from '@/features/media/hooks';
import { CameraIcon, PencilIcon, TrashIcon } from '@heroicons/react/24/outline';
import Image from 'next/image';
import React, { useState } from 'react';

interface ProfileImageSectionProps {
  businessProfile: Record<string, unknown>;
  isLoading: boolean;
  onLogoImageChange: (
    _file: File,
    _publicUrl?: string,
    _storagePath?: string
  ) => void;
}

// Enhanced Upload Component with Better UX - Matching Step 4 Portfolio theme
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
        flex flex-col items-center justify-center w-full p-4 sm:p-6 transition duration-300
        border-2 sm:border-4 border-dashed rounded-lg sm:rounded-xl cursor-pointer
        ${
          disabled
            ? 'opacity-50 cursor-not-allowed border-neutral-700 bg-neutral-900'
            : dragActive
              ? 'border-orange-400 bg-orange-500/10'
              : 'border-orange-400/50 bg-neutral-900 hover:bg-neutral-900/70'
        }
      `}
      htmlFor="logo-upload"
      onDragEnter={handleDrag}
      onDragLeave={handleDrag}
      onDragOver={handleDrag}
      onDrop={handleDrop}
    >
      <CameraIcon className="h-8 w-8 sm:h-10 sm:w-10 text-orange-400 mb-3" />
      <p className="mb-1 text-sm sm:text-base text-white font-semibold">
        {dragActive ? 'Drop your logo here' : 'Click to upload or drag & drop'}
      </p>
      <p className="text-xs sm:text-sm text-gray-500 text-center max-w-xs">
        Square logos work best! JPG, PNG up to 10MB
      </p>
      <input
        id="logo-upload"
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleFileChange}
        disabled={disabled}
      />
    </label>
  );
};

export const ProfileImageSection: React.FC<ProfileImageSectionProps> = ({
  businessProfile,
  onLogoImageChange,
}) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [tempLogo, setTempLogo] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  const { uploadLogo, isUploading, error, reset } = useUploadLogo();

  const openModal = () => {
    setTempLogo(businessProfile.logo_url as string | null);
    setIsModalOpen(true);
    reset();
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setTempLogo(null);
    setSelectedFile(null);
    reset();
  };

  const handleSaveLogo = async () => {
    if (selectedFile) {
      const result = await uploadLogo({
        businessId: businessProfile.id as string,
        file: selectedFile,
        previousPath: businessProfile.logo_path as string | undefined,
      });

      if (result.success) {
        console.log('✅ Logo uploaded successfully:', result);

        // Update the temp logo preview with the new uploaded image URL
        if (result.publicUrl) {
          setTempLogo(result.publicUrl);
        }

        // Notify parent component of the change with the new public URL and storage path
        onLogoImageChange(selectedFile, result.publicUrl, result.storagePath);
        closeModal();
      } else {
        console.error('❌ Logo upload failed:', result.error);
      }
    } else {
      closeModal();
    }
  };

  const handleRemoveLogo = () => {
    setTempLogo(null);
    setSelectedFile(null);
  };

  return (
    <div className="space-y-4">
      {/* Section Header - More Prominent */}
      <div className="mb-6">
        <h2 className="text-xl sm:text-2xl font-bold text-white mb-2 border-l-4 border-orange-400 pl-3">
          Business Logo
        </h2>
        <p className="text-sm sm:text-base text-gray-400">
          Click to add or change your business logo
        </p>
      </div>

      {/* Logo Display - Mobile-Friendly with Always-Visible Indicators */}
      <div
        onClick={openModal}
        className="relative group cursor-pointer inline-block"
      >
        <div className="w-32 h-32 sm:w-36 sm:h-36 bg-neutral-800 rounded-full overflow-hidden flex items-center justify-center border-4 border-neutral-700 hover:border-orange-400 transition-all duration-300">
          {businessProfile.logo_url &&
          (businessProfile.logo_url as string).trim() ? (
            <>
              <Image
                src={businessProfile.logo_url as string}
                alt="Logo"
                width={144}
                height={144}
                className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-110"
              />
              {/* Always visible camera badge - larger and more prominent */}
              <div className="absolute bottom-1 right-1 bg-orange-500 text-white p-2 rounded-full shadow-lg border-2 border-neutral-900">
                <CameraIcon className="h-4 w-4" />
              </div>
              {/* Always visible "Change" text on mobile */}
              <div className="absolute top-1 left-1 bg-black/80 backdrop-blur-sm text-white px-2 py-1 rounded-full text-xs font-medium sm:hidden">
                Change
              </div>
            </>
          ) : (
            <div className="text-center">
              <div className="bg-neutral-700 rounded-full p-3 mx-auto mb-2">
                <CameraIcon className="h-6 w-6 text-orange-400" />
              </div>
              <span className="text-xs font-semibold text-white">Add Logo</span>
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="bg-orange-500/90 backdrop-blur-sm text-white px-3 py-1 rounded-full text-xs font-medium">
                  Click to upload
                </div>
              </div>
            </div>
          )}
        </div>
        {/* Desktop hover overlay - only shows on hover for desktop */}
        <div className="absolute inset-0 items-center justify-center bg-black/60 rounded-full opacity-0 group-hover:opacity-100 transition-opacity hidden sm:flex">
          <div className="text-center">
            <div className="bg-orange-500 rounded-full p-2 mx-auto mb-1">
              <PencilIcon className="h-5 w-5 text-white" />
            </div>
            <span className="text-xs text-white font-semibold">
              {businessProfile.logo_url ? 'Change' : 'Upload'}
            </span>
          </div>
        </div>
      </div>

      {/* Modal for Business Logo */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Edit Business Logo"
      >
        <div className="space-y-4 sm:space-y-6">
          {/* Simplified Description - Only show if no current logo */}
          {(!tempLogo || !tempLogo.trim()) && (
            <div className="text-center">
              <p className="text-sm sm:text-base text-gray-400 leading-relaxed">
                Upload a professional logo to represent your business
              </p>
            </div>
          )}

          {/* Compact Preview Section */}
          {tempLogo && tempLogo.trim() && (
            <div className="space-y-3">
              <h4 className="text-sm sm:text-base font-semibold text-white">
                Current Logo
              </h4>
              <div className="flex justify-center">
                <div className="w-24 h-24 sm:w-32 sm:h-32 rounded-full bg-neutral-700 overflow-hidden relative border-2 sm:border-4 border-neutral-600">
                  <Image
                    src={tempLogo}
                    alt="Logo Preview"
                    width={128}
                    height={128}
                    className="w-full h-full object-cover"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Upload Section */}
          <div className="space-y-3">
            <h4 className="text-sm sm:text-base font-semibold text-white">
              {tempLogo && tempLogo.trim() ? 'Replace Logo' : 'Upload Logo'}
            </h4>
            <EnhancedImageUpload
              onImageSelect={file => {
                setSelectedFile(file);
                const reader = new FileReader();
                reader.onloadend = () => setTempLogo(reader.result as string);
                reader.readAsDataURL(file);
              }}
              disabled={isUploading}
            />
          </div>

          {/* Error Message */}
          {error && (
            <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-3">
              <p className="text-red-400 text-sm font-medium text-center">
                {error}
              </p>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 pt-2">
            <Button
              onClick={handleSaveLogo}
              disabled={isUploading || !selectedFile}
              variant="primary"
              className="flex-1"
              loading={isUploading}
            >
              {isUploading ? 'Uploading...' : 'Save Logo'}
            </Button>
            {tempLogo && (
              <Button
                onClick={handleRemoveLogo}
                disabled={isUploading}
                variant="danger"
                className="flex-1 sm:flex-none sm:px-6"
              >
                <TrashIcon className="w-4 h-4 mr-2" />
                Remove
              </Button>
            )}
          </div>
        </div>
      </Modal>
    </div>
  );
};
