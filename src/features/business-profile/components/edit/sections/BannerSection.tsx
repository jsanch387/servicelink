'use client';

import { Button } from '@/components/shared';
import { useUploadBanner } from '@/features/media/hooks';
import {
  CameraIcon,
  PencilIcon,
  PhotoIcon,
  TrashIcon,
  XMarkIcon,
} from '@heroicons/react/24/outline';
import Image from 'next/image';
import React, { useState } from 'react';

interface BannerSectionProps {
  businessProfile: Record<string, unknown>;
  isLoading: boolean;
  onCoverImageChange: (
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
      htmlFor="cover-photo-upload"
      onDragEnter={handleDrag}
      onDragLeave={handleDrag}
      onDragOver={handleDrag}
      onDrop={handleDrop}
    >
      <CameraIcon className="h-10 w-10 sm:h-12 sm:w-12 text-orange-400 mb-4" />
      <p className="mb-2 text-base sm:text-lg text-white font-semibold">
        {dragActive ? 'Drop your photo here' : 'Click to upload or drag & drop'}
      </p>
      <p className="text-sm text-gray-500 text-center max-w-xs">
        Any size works! We&apos;ll automatically make it look perfect.
        <br />
        JPG, PNG up to 10MB
      </p>
      <input
        id="cover-photo-upload"
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleFileChange}
        disabled={disabled}
      />
    </label>
  );
};

export const BannerSection: React.FC<BannerSectionProps> = ({
  businessProfile,
  isLoading,
  onCoverImageChange,
}) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [tempCoverPhoto, setTempCoverPhoto] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  const { uploadBanner, isUploading, error, reset } = useUploadBanner();

  const openModal = () => {
    setTempCoverPhoto(businessProfile.cover_image_url as string | null);
    setIsModalOpen(true);
    reset();
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setTempCoverPhoto(null);
    setSelectedFile(null);
    reset();
  };

  const handleSaveCover = async () => {
    if (selectedFile) {
      const result = await uploadBanner({
        businessId: businessProfile.id as string,
        file: selectedFile,
        previousPath: businessProfile.banner_path as string | undefined,
      });

      if (result.success) {
        console.log('✅ Banner uploaded successfully:', result);

        // Update the temp banner preview with the new uploaded image URL
        if (result.publicUrl) {
          setTempCoverPhoto(result.publicUrl);
        }

        // Notify parent component of the change with the new public URL and storage path
        onCoverImageChange(selectedFile, result.publicUrl, result.storagePath);
        closeModal();
      } else {
        console.error('❌ Banner upload failed:', result.error);
      }
    } else {
      closeModal();
    }
  };

  const handleRemoveCover = () => {
    setTempCoverPhoto(null);
    setSelectedFile(null);
  };

  const coverEmptyState = (
    <div className="w-full h-full flex items-center justify-center text-gray-400 p-4 text-center">
      <div className="flex flex-col items-center">
        <PhotoIcon className="h-12 w-12 text-gray-500 mb-2" />
        <p className="text-sm font-semibold">Add a cover photo</p>
        <p className="text-xs text-gray-500 mt-1">Recommended: 1200x400px</p>
      </div>
    </div>
  );

  return (
    <div className="space-y-6 sm:space-y-8">
      {/* Section Header */}
      <div>
        <h2 className="text-lg sm:text-xl lg:text-2xl font-bold text-white mb-6 sm:mb-8 text-left border-l-4 border-orange-400 pl-3 uppercase tracking-wider">
          Cover Photo
        </h2>
        <p className="text-sm sm:text-base text-gray-400 leading-relaxed">
          Add a professional cover photo to showcase your business and create a
          strong first impression.
        </p>
      </div>

      {/* Cover Photo Display */}
      <div
        onClick={openModal}
        className="relative group w-full h-48 sm:h-56 md:h-64 bg-neutral-700 rounded-xl overflow-hidden cursor-pointer transition-all duration-300 hover:bg-neutral-600 border-2 border-neutral-600 hover:border-orange-400"
      >
        {businessProfile.cover_image_url &&
        (businessProfile.cover_image_url as string).trim() ? (
          <Image
            src={businessProfile.cover_image_url as string}
            alt="Cover"
            width={800}
            height={320}
            className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <div className="text-center text-gray-400">
              <PhotoIcon className="h-12 w-12 sm:h-16 sm:w-16 text-gray-500 mb-4 mx-auto" />
              <p className="text-lg font-semibold mb-2">Add a cover photo</p>
              <p className="text-sm text-gray-500">Recommended: 1200x400px</p>
            </div>
          </div>
        )}
        <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-50 opacity-0 group-hover:opacity-100 transition-opacity">
          <div className="text-white text-center">
            <PencilIcon className="h-8 w-8 mx-auto mb-2" />
            <span className="font-semibold text-sm">
              {businessProfile.cover_image_url
                ? 'Change Cover Photo'
                : 'Add Cover Photo'}
            </span>
          </div>
        </div>
      </div>

      {/* Modal for Cover Photo */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Edit Cover Photo"
      >
        <div className="space-y-6 sm:space-y-8">
          {/* Description */}
          <div className="text-center">
            <p className="text-lg sm:text-xl text-gray-400 leading-relaxed">
              Upload a professional cover photo to showcase your business
            </p>
            <p className="text-sm text-gray-500 mt-2">
              Recommended: 1200x400px • JPG, PNG up to 10MB
            </p>
          </div>

          {/* Preview Section */}
          {tempCoverPhoto && tempCoverPhoto.trim() && (
            <div className="space-y-4">
              <h4 className="text-lg font-bold text-white border-l-4 border-orange-400 pl-3 uppercase tracking-wider">
                Current Preview
              </h4>
              <div className="w-full h-40 sm:h-48 rounded-xl bg-neutral-700 overflow-hidden relative border border-neutral-600">
                <Image
                  src={tempCoverPhoto}
                  alt="Cover Photo Preview"
                  width={800}
                  height={320}
                  className="w-full h-full object-cover"
                />
              </div>
            </div>
          )}

          {/* Upload Section */}
          <div className="space-y-4">
            <h4 className="text-lg font-bold text-white border-l-4 border-orange-400 pl-3 uppercase tracking-wider">
              Upload New Photo
            </h4>
            <EnhancedImageUpload
              onImageSelect={file => {
                setSelectedFile(file);
                const reader = new FileReader();
                reader.onloadend = () =>
                  setTempCoverPhoto(reader.result as string);
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
              onClick={handleSaveCover}
              disabled={isUploading || !selectedFile}
              variant="primary"
              className="flex-1"
              loading={isUploading}
            >
              {isUploading ? 'Uploading...' : 'Save Cover Photo'}
            </Button>
            {tempCoverPhoto && (
              <Button
                onClick={handleRemoveCover}
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
