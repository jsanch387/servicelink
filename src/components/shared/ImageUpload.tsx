'use client';

import React, { useRef, useState } from 'react';
import { PhotoIcon, XMarkIcon } from '@heroicons/react/24/outline';

interface ImageUploadProps {
  onImageSelect: (file: File) => void;
  disabled?: boolean;
  className?: string;
}

export const ImageUpload: React.FC<ImageUploadProps> = ({
  onImageSelect,
  disabled = false,
  className = '',
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [dragActive, setDragActive] = useState(false);

  const handleFileSelect = (file: File) => {
    // Validate file type
    if (!file.type.startsWith('image/')) {
      console.error('❌ Invalid file type. Please select an image.');
      return;
    }

    // Validate file size (max 10MB)
    if (file.size > 10 * 1024 * 1024) {
      console.error('❌ File too large. Please select an image under 10MB.');
      return;
    }

    console.log('📸 Image selected:', file.name, file.size);
    onImageSelect(file);
  };

  const handleClick = () => {
    if (!disabled) {
      fileInputRef.current?.click();
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleFileSelect(file);
    }
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

    if (disabled) return;

    const file = e.dataTransfer.files?.[0];
    if (file) {
      handleFileSelect(file);
    }
  };

  return (
    <div className={`w-full ${className}`}>
      <div
        className={`
          relative border-2 border-dashed rounded-lg p-8 text-center cursor-pointer
          transition-colors duration-200
          ${
            dragActive
              ? 'border-orange-500 bg-orange-500/10'
              : 'border-neutral-600 hover:border-neutral-500'
          }
          ${disabled ? 'opacity-50 cursor-not-allowed' : ''}
        `}
        onClick={handleClick}
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={handleFileChange}
          className="hidden"
          disabled={disabled}
        />

        <PhotoIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />

        <div className="text-white mb-2">
          <span className="text-lg font-medium">Upload an image</span>
        </div>

        <div className="text-gray-400 text-sm">
          <p>Drag and drop or click to browse</p>
          <p className="mt-1">Instagram size recommended (1080x1080)</p>
        </div>

        {dragActive && (
          <div className="absolute inset-0 bg-orange-500/20 rounded-lg flex items-center justify-center">
            <p className="text-orange-400 font-medium">Drop image here</p>
          </div>
        )}
      </div>
    </div>
  );
};

interface ImagePreviewProps {
  src: string;
  alt: string;
  onRemove: () => void;
  className?: string;
}

export const ImagePreview: React.FC<ImagePreviewProps> = ({
  src,
  alt,
  onRemove,
  className = '',
}) => {
  return (
    <div className={`relative group ${className}`}>
      <img
        src={src}
        alt={alt}
        className="w-full h-32 object-cover rounded-lg border border-neutral-700"
      />

      <button
        onClick={onRemove}
        className="absolute -top-2 -right-2 bg-red-500 hover:bg-red-600 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
      >
        <XMarkIcon className="h-4 w-4" />
      </button>
    </div>
  );
};
