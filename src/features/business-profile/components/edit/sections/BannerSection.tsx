'use client';

import React, { useState } from 'react';
import { ImageUpload } from '@/components/shared';
import { useUploadBanner } from '@/features/media/hooks';
import {
  PhotoIcon,
  TrashIcon,
  CloudArrowUpIcon,
  XMarkIcon,
  PencilIcon,
} from '@heroicons/react/24/outline';

interface BannerSectionProps {
  businessProfile: any;
  isLoading: boolean;
  onCoverImageChange: (file: File) => void;
}

// Modal component for editing
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
      <div className="bg-neutral-800 rounded-xl shadow-2xl p-6 w-full max-w-lg mx-auto border border-neutral-700">
        <div className="flex justify-between items-center pb-4 border-b border-neutral-700 mb-4">
          <h3 className="text-xl font-bold text-white">{title}</h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white transition-colors"
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
    setTempCoverPhoto(businessProfile.cover_image_url);
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
        businessId: businessProfile.id,
        file: selectedFile,
        previousPath: businessProfile.banner_path,
      });

      if (result.success) {
        console.log('✅ Banner uploaded successfully:', result);
        onCoverImageChange(selectedFile);
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
    <div className="bg-neutral-800 border border-neutral-700 rounded-lg overflow-hidden p-6">
      <h2 className="text-2xl font-bold text-white mb-6">Cover Photo</h2>
      <div className="space-y-4">
        <label className="block text-sm font-medium text-gray-300">
          Cover Photo
        </label>
        <div
          onClick={openModal}
          className="relative group w-full h-48 bg-neutral-700 rounded-lg overflow-hidden cursor-pointer transition-colors hover:bg-neutral-600"
        >
          {businessProfile.cover_image_url &&
          businessProfile.cover_image_url.trim() ? (
            <img
              src={businessProfile.cover_image_url}
              alt="Cover"
              className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
            />
          ) : (
            coverEmptyState
          )}
          <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-50 opacity-0 group-hover:opacity-100 transition-opacity">
            <div className="text-white text-center">
              <PencilIcon className="h-8 w-8 mx-auto mb-2" />
              <span className="font-semibold text-sm">Change Cover Photo</span>
            </div>
          </div>
        </div>
      </div>

      {/* Modal for Cover Photo */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Edit Cover Photo"
      >
        <div className="space-y-4">
          <p className="text-gray-400 text-sm">
            Upload a new photo or remove the current one.
          </p>
          <div className="w-full h-32 rounded-lg bg-neutral-700 overflow-hidden relative border border-neutral-600">
            {tempCoverPhoto && tempCoverPhoto.trim() ? (
              <img
                src={tempCoverPhoto}
                alt="Preview"
                className="w-full h-full object-cover"
              />
            ) : (
              coverEmptyState
            )}
          </div>
          <ImageUpload
            onImageSelect={file => {
              setSelectedFile(file);
              const reader = new FileReader();
              reader.onloadend = () =>
                setTempCoverPhoto(reader.result as string);
              reader.readAsDataURL(file);
            }}
          />
          {error && (
            <div className="text-red-400 text-sm bg-red-900/20 border border-red-800 rounded-lg p-3">
              {error}
            </div>
          )}
          <div className="flex justify-between gap-4 mt-4">
            <button
              onClick={handleSaveCover}
              disabled={isUploading || !selectedFile}
              className="flex-1 bg-white text-neutral-900 font-semibold px-4 py-2 rounded-lg hover:bg-neutral-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {isUploading ? (
                <>
                  <div className="w-4 h-4 border-2 border-neutral-900 border-t-transparent rounded-full animate-spin" />
                  Uploading...
                </>
              ) : (
                'Save'
              )}
            </button>
            {tempCoverPhoto && (
              <button
                onClick={handleRemoveCover}
                disabled={isUploading}
                className="flex-1 text-red-500 flex items-center justify-center gap-2 p-2 rounded-lg hover:bg-neutral-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <TrashIcon className="w-4 h-4" />
                Remove
              </button>
            )}
          </div>
        </div>
      </Modal>
    </div>
  );
};
