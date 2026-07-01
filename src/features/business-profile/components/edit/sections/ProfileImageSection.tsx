/* eslint-disable no-unused-vars */
'use client';

import { Button, GlassCard, Modal } from '@/components/shared';
import { useUploadLogo } from '@/features/media/hooks';
import { CameraIcon, TrashIcon } from '@heroicons/react/24/outline';
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
      htmlFor="logo-upload"
      onDragEnter={handleDrag}
      onDragLeave={handleDrag}
      onDragOver={handleDrag}
      onDrop={handleDrop}
    >
      <CameraIcon className="h-9 w-9 sm:h-10 sm:w-10 text-gray-400 mb-2 flex-shrink-0" />
      <p className="text-sm font-medium text-white">
        {dragActive ? 'Drop here' : 'Add logo'}
      </p>
      <p className="text-xs text-gray-500 mt-0.5">JPG, PNG · 10MB max</p>
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
    <div className="w-full max-w-full text-left">
      <p className="text-sm font-medium text-gray-200">Logo</p>

      <GlassCard padding="sm" rounded="rounded-xl" className="mt-2 w-full">
        <div onClick={openModal} className="relative group cursor-pointer">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-full overflow-hidden flex items-center justify-center border border-white/10 bg-white/[0.04] flex-shrink-0">
              {businessProfile.logo_url &&
              (businessProfile.logo_url as string).trim() ? (
                <Image
                  src={businessProfile.logo_url as string}
                  alt="Logo"
                  width={96}
                  height={96}
                  className="w-full h-full object-cover"
                  unoptimized={(businessProfile.logo_url as string).startsWith(
                    'http'
                  )}
                  loading="lazy"
                  decoding="async"
                />
              ) : (
                <CameraIcon className="h-8 w-8 text-neutral-500" />
              )}
            </div>

            <div className="flex-1 min-w-0">
              <p className="text-sm text-gray-300">
                {businessProfile.logo_url &&
                (businessProfile.logo_url as string).trim()
                  ? 'Tap to change'
                  : 'Tap to add logo'}
              </p>
            </div>

            <div className="flex-shrink-0">
              <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center">
                <CameraIcon className="h-4 w-4 text-gray-300" />
              </div>
            </div>
          </div>
        </div>
      </GlassCard>

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
                <div className="w-24 h-24 sm:w-32 sm:h-32 rounded-full overflow-hidden relative border-2 sm:border-4 border-white/10 bg-white/[0.04]">
                  <Image
                    src={tempLogo}
                    alt="Logo Preview"
                    width={128}
                    height={128}
                    className="w-full h-full object-cover"
                    unoptimized={tempLogo.startsWith('http')}
                    loading="lazy"
                    decoding="async"
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
