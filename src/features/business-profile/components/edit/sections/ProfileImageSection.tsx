'use client';

import { ImageUpload } from '@/components/shared';
import { useUploadLogo } from '@/features/media/hooks';
import {
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
    <div className="bg-neutral-800 border border-neutral-700 rounded-lg overflow-hidden p-6">
      <h2 className="text-2xl font-bold text-white mb-6">Business Logo</h2>
      <div className="space-y-4">
        <label className="block text-sm font-medium text-gray-300">
          Business Logo
        </label>
        <div
          onClick={openModal}
          className="relative w-24 h-24 flex-shrink-0 group cursor-pointer"
        >
          <div className="w-full h-full bg-neutral-700 rounded-full overflow-hidden flex items-center justify-center transition-colors hover:bg-neutral-600">
            {businessProfile.logo_url &&
            (businessProfile.logo_url as string).trim() ? (
              <Image
                src={businessProfile.logo_url as string}
                alt="Logo"
                width={120}
                height={120}
                className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
              />
            ) : (
              logoEmptyState
            )}
            <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-50 rounded-full opacity-0 group-hover:opacity-100 transition-opacity">
              <PencilIcon className="h-6 w-6 text-white" />
            </div>
          </div>
        </div>
        <p className="text-xs text-gray-400">
          Recommended: 200x200px. Square images work best.
        </p>
      </div>

      {/* Modal for Business Logo */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Edit Business Logo"
      >
        <div className="space-y-4">
          <p className="text-gray-400 text-sm">
            Upload a new logo or remove the current one.
          </p>
          <div className="w-24 h-24 rounded-full bg-neutral-700 overflow-hidden mx-auto relative border border-neutral-600">
            {tempLogo && tempLogo.trim() ? (
              <Image
                src={tempLogo}
                alt="Preview"
                width={120}
                height={120}
                className="w-full h-full object-cover"
              />
            ) : (
              logoEmptyState
            )}
          </div>
          <ImageUpload
            onImageSelect={file => {
              setSelectedFile(file);
              const reader = new FileReader();
              reader.onloadend = () => setTempLogo(reader.result as string);
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
              onClick={handleSaveLogo}
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
            {tempLogo && (
              <button
                onClick={handleRemoveLogo}
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
