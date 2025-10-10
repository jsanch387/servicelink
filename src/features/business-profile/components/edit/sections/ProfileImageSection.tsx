'use client';

import { Button } from '@/components/shared';
import { useUploadLogo } from '@/features/media/hooks';
import {
  CameraIcon,
  PencilIcon,
  PhotoIcon,
  TrashIcon,
  XMarkIcon,
} from '@heroicons/react/24/outline';
import Image from 'next/image';
import React, { useState } from 'react';

interface ProfileImageSectionProps {
  businessProfile: Record<string, unknown>;
  isLoading: boolean;
  onLogoImageChange: (
    file: File,
    publicUrl?: string,
    storagePath?: string
  ) => void;
}

// Modal component for editing - Updated to match Step 4 Portfolio theme
const Modal = ({
  isOpen,
  onClose,
  title,
  children,
}: {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
}) => {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-70 backdrop-blur-sm">
      <div className="bg-neutral-800 border-2 border-neutral-700 rounded-3xl p-6 sm:p-8 lg:p-10 w-full max-w-2xl mx-auto">
        <div className="flex justify-between items-center pb-6 border-b border-neutral-700 mb-6">
          <h3 className="text-xl sm:text-2xl font-bold text-white border-l-4 border-orange-400 pl-3 uppercase tracking-wider">
            {title}
          </h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white transition-colors p-2 hover:bg-neutral-700 rounded-lg"
            aria-label="Close modal"
          >
            <XMarkIcon className="w-6 h-6" />
          </button>
        </div>
        {children}
      </div>
    </div>
  );
};

// Enhanced Upload Component with Better UX - Matching Step 4 Portfolio theme
const EnhancedImageUpload: React.FC<{
  onImageSelect: (file: File) => void;
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
        flex flex-col items-center justify-center w-full p-6 sm:p-8 transition duration-300
        border-4 border-dashed rounded-xl cursor-pointer
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
      <CameraIcon className="h-10 w-10 sm:h-12 sm:w-12 text-orange-400 mb-4" />
      <p className="mb-2 text-base sm:text-lg text-white font-semibold">
        {dragActive ? 'Drop your logo here' : 'Click to upload or drag & drop'}
      </p>
      <p className="text-sm text-gray-500 text-center max-w-xs">
        Square logos work best! We&apos;ll automatically make it look perfect.
        <br />
        JPG, PNG up to 10MB
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
  isLoading,
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

  const logoEmptyState = (
    <div className="w-full h-full flex items-center justify-center">
      <PhotoIcon className="h-8 w-8 text-gray-500" />
    </div>
  );

  return (
    <div className="space-y-6 sm:space-y-8">
      {/* Section Header */}
      <div>
        <h2 className="text-lg sm:text-xl lg:text-2xl font-bold text-white mb-6 sm:mb-8 text-left border-l-4 border-orange-400 pl-3 uppercase tracking-wider">
          Business Logo
        </h2>
        <p className="text-sm sm:text-base text-gray-400 leading-relaxed">
          Add a professional logo to build brand recognition and establish
          credibility with your customers.
        </p>
      </div>

      {/* Logo Display Section - Improved mobile centering */}
      <div className="flex flex-col lg:flex-row items-center lg:items-start space-y-6 lg:space-y-0 lg:space-x-8">
        <div
          onClick={openModal}
          className="relative w-32 h-32 flex-shrink-0 group cursor-pointer"
        >
          <div className="w-full h-full bg-neutral-700 rounded-full overflow-hidden flex items-center justify-center transition-all duration-300 hover:bg-neutral-600 border-4 border-neutral-600 group-hover:border-orange-400">
            {businessProfile.logo_url &&
            (businessProfile.logo_url as string).trim() ? (
              <Image
                src={businessProfile.logo_url as string}
                alt="Logo"
                width={128}
                height={128}
                className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
              />
            ) : (
              <div className="flex flex-col items-center text-gray-400">
                <PhotoIcon className="h-8 w-8 mb-2" />
                <span className="text-xs font-medium">No Logo</span>
              </div>
            )}
            <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-50 rounded-full opacity-0 group-hover:opacity-100 transition-opacity">
              <div className="text-center">
                <PencilIcon className="h-6 w-6 text-white mx-auto mb-1" />
                <span className="text-xs text-white font-medium">
                  {businessProfile.logo_url ? 'Edit Logo' : 'Add Logo'}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Logo Info - Centered on mobile, left-aligned on desktop */}
        <div className="flex-1 text-center lg:text-left max-w-md lg:max-w-none">
          <h3 className="text-lg font-semibold text-white mb-3">
            {businessProfile.logo_url ? 'Current Logo' : 'No Logo Set'}
          </h3>
          <p className="text-sm text-gray-400 mb-6 leading-relaxed">
            {businessProfile.logo_url
              ? 'Click the logo to edit or replace it'
              : 'Add a professional logo to build brand recognition'}
          </p>
          <Button
            onClick={openModal}
            variant="secondary"
            size="sm"
            className="w-full sm:w-auto"
          >
            <PencilIcon className="h-4 w-4 mr-2" />
            {businessProfile.logo_url ? 'Edit Logo' : 'Add Logo'}
          </Button>
        </div>
      </div>

      {/* Guidelines */}
      <div className="bg-neutral-900 border border-neutral-700 rounded-xl p-4 sm:p-6">
        <h4 className="text-sm font-semibold text-white mb-3 flex items-center">
          <PhotoIcon className="h-4 w-4 mr-2 text-orange-400" />
          Logo Guidelines
        </h4>
        <ul className="text-xs sm:text-sm text-gray-400 space-y-1">
          <li>• Recommended: 200x200px square format</li>
          <li>• Use high-quality images for best results</li>
          <li>• PNG with transparent background preferred</li>
          <li>• Keep it simple and recognizable at small sizes</li>
        </ul>
      </div>

      {/* Modal for Business Logo */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Edit Business Logo"
      >
        <div className="space-y-6 sm:space-y-8">
          {/* Description */}
          <div className="text-center">
            <p className="text-lg sm:text-xl text-gray-400 leading-relaxed">
              Upload a professional logo to represent your business
            </p>
            <p className="text-sm text-gray-500 mt-2">
              Recommended: 200x200px • Square format works best • JPG, PNG up to
              10MB
            </p>
          </div>

          {/* Preview Section */}
          {tempLogo && tempLogo.trim() && (
            <div className="space-y-4">
              <h4 className="text-lg font-bold text-white border-l-4 border-orange-400 pl-3 uppercase tracking-wider">
                Current Preview
              </h4>
              <div className="flex justify-center">
                <div className="w-32 h-32 rounded-full bg-neutral-700 overflow-hidden relative border-4 border-neutral-600">
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
          <div className="space-y-4">
            <h4 className="text-lg font-bold text-white border-l-4 border-orange-400 pl-3 uppercase tracking-wider">
              Upload New Logo
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
            <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-4">
              <p className="text-red-400 text-sm font-medium text-center">
                {error}
              </p>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 pt-4">
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
                className="flex-1 sm:flex-none sm:px-8"
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
