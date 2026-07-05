'use client';

import { Button, GlassCard, Modal } from '@/components/shared';
import { useUploadBanner } from '@/features/media/hooks';
import { CameraIcon, PencilIcon, TrashIcon } from '@heroicons/react/24/outline';
import Image from 'next/image';
import React, { useState } from 'react';

interface BannerSectionProps {
  businessProfile: Record<string, unknown>;
  isLoading: boolean;
  onCoverImageChange: (
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
      htmlFor="cover-photo-upload"
      onDragEnter={handleDrag}
      onDragLeave={handleDrag}
      onDragOver={handleDrag}
      onDrop={handleDrop}
    >
      <CameraIcon className="h-9 w-9 sm:h-10 sm:w-10 text-gray-400 mb-2 flex-shrink-0" />
      <p className="text-sm font-medium text-white">
        {dragActive ? 'Drop here' : 'Add cover photo'}
      </p>
      <p className="text-xs text-gray-500 mt-0.5">JPG, PNG · 10MB max</p>
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

  return (
    <div className="w-full max-w-full text-left">
      <p className="text-sm font-medium text-gray-200">Cover</p>

      <GlassCard
        padding="none"
        rounded="rounded-xl"
        className="mt-2 w-full overflow-hidden"
      >
        <div
          onClick={openModal}
          className="relative group w-full h-44 sm:h-52 cursor-pointer bg-white/[0.02] hover:bg-white/[0.04] transition-all duration-300"
        >
          {businessProfile.cover_image_url &&
          (businessProfile.cover_image_url as string).trim() ? (
            <>
              <Image
                src={businessProfile.cover_image_url as string}
                alt="Cover"
                width={800}
                height={320}
                className="w-full h-full object-cover object-center transition-transform duration-300 group-hover:scale-105"
                unoptimized={(
                  businessProfile.cover_image_url as string
                ).startsWith('http')}
                loading="lazy"
                decoding="async"
              />
              {/* Always visible edit indicator */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
              <div className="absolute bottom-4 left-4 right-4 flex items-center justify-between">
                <span className="text-white text-sm font-medium bg-black/40 backdrop-blur-sm px-3 py-1.5 rounded-full">
                  Click to change
                </span>
                <div className="bg-white/20 text-white p-2 rounded-full">
                  <CameraIcon className="h-5 w-5" />
                </div>
              </div>
            </>
          ) : (
            <div className="w-full h-full flex items-center justify-center border-2 border-dashed border-white/10 rounded-xl hover:border-white/20 transition-colors">
              <div className="text-center text-gray-400">
                <div className="rounded-full bg-white/10 p-4 mx-auto mb-3 w-fit">
                  <CameraIcon className="h-8 w-8 text-gray-400" />
                </div>
                <p className="text-base font-semibold mb-1 text-white">
                  Click to add cover photo
                </p>
                <p className="text-xs text-gray-500">1200x400px recommended</p>
              </div>
            </div>
          )}
          {/* Hover overlay - only shows on hover */}
          <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
            <div className="text-white text-center">
              <div className="rounded-full bg-white/20 p-3 mx-auto mb-2 w-fit">
                <PencilIcon className="h-6 w-6" />
              </div>
              <span className="font-semibold text-base">
                {businessProfile.cover_image_url
                  ? 'Change Cover Photo'
                  : 'Upload Cover Photo'}
              </span>
            </div>
          </div>
        </div>
      </GlassCard>

      {/* Modal for Cover Photo */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Edit Cover Photo"
      >
        <div className="space-y-4 sm:space-y-6">
          {/* Simplified Description - Only show if no current photo */}
          {(!tempCoverPhoto || !tempCoverPhoto.trim()) && (
            <div className="text-center">
              <p className="text-sm sm:text-base text-gray-400 leading-relaxed">
                Upload a professional cover photo to showcase your business
              </p>
            </div>
          )}

          {/* Compact Preview Section */}
          {tempCoverPhoto && tempCoverPhoto.trim() && (
            <div className="space-y-3">
              <h4 className="text-sm sm:text-base font-semibold text-white">
                Current Photo
              </h4>
              <div className="w-full h-32 sm:h-40 rounded-lg overflow-hidden relative border border-white/10 bg-white/[0.04]">
                <Image
                  src={tempCoverPhoto}
                  alt="Cover Photo Preview"
                  width={800}
                  height={320}
                  className="w-full h-full object-cover"
                  unoptimized={tempCoverPhoto.startsWith('http')}
                  loading="lazy"
                  decoding="async"
                />
              </div>
            </div>
          )}

          {/* Upload Section */}
          <div className="space-y-3">
            <h4 className="text-sm sm:text-base font-semibold text-white">
              {tempCoverPhoto && tempCoverPhoto.trim()
                ? 'Replace Photo'
                : 'Upload Photo'}
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
            <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-3">
              <p className="text-red-400 text-sm font-medium text-center">
                {error}
              </p>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 pt-2">
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
