'use client';

import { ImageWithFallback } from '@/components/shared';
import { serviceImageInitial } from '@/features/services/utils/serviceImage';
import { getServiceImageUrl } from '@/features/services/utils/serviceImageUrl';
import { useUploadServiceImage } from '@/features/media/hooks';
import { PhotoIcon, TrashIcon } from '@heroicons/react/24/outline';
import React, { useRef, useState } from 'react';

interface ServiceImageFieldProps {
  businessId: string;
  serviceId: string;
  serviceName: string;
  imagePath?: string | null;
  onImagePathChange?: (path: string | null) => void;
}

export function ServiceImageField({
  businessId,
  serviceId,
  serviceName,
  imagePath,
  onImagePathChange,
}: ServiceImageFieldProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [localPath, setLocalPath] = useState<string | null>(imagePath ?? null);
  const { uploadServiceImage, removeServiceImage, isUploading, error } =
    useUploadServiceImage();

  const imageUrl = getServiceImageUrl({ image_path: localPath });
  const initial = serviceImageInitial(serviceName);

  const handleFile = async (file: File | undefined) => {
    if (!file) return;
    const result = await uploadServiceImage({
      businessId,
      serviceId,
      file,
      previousPath: localPath,
    });
    if (result.success && result.storagePath) {
      setLocalPath(result.storagePath);
      onImagePathChange?.(result.storagePath);
    }
  };

  const handleRemove = async () => {
    const result = await removeServiceImage(businessId, serviceId, localPath);
    if (result.success) {
      setLocalPath(null);
      onImagePathChange?.(null);
    }
  };

  return (
    <section className="mb-6 rounded-2xl border border-white/10 bg-white/[0.02] p-4 sm:p-5">
      <div className="flex items-center gap-4">
        <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-xl bg-zinc-800 ring-1 ring-white/10">
          {imageUrl ? (
            <ImageWithFallback
              src={imageUrl}
              alt=""
              width={128}
              height={128}
              className="h-full w-full object-cover"
              fallbackLabel={serviceName}
              fallbackSize={{ w: 128, h: 128 }}
              sizes="64px"
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-zinc-700 to-zinc-800">
              <span className="text-lg font-semibold text-white/70">
                {initial}
              </span>
            </div>
          )}
        </div>

        <div className="min-w-0 flex-1">
          <p className="text-sm font-medium text-white">Service photo</p>
          <p className="mt-0.5 text-xs leading-snug text-zinc-500">
            Shown on your booking link. Square photos look best.
          </p>
          <div className="mt-2.5 flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => inputRef.current?.click()}
              disabled={isUploading}
              className="inline-flex cursor-pointer items-center gap-1.5 rounded-lg border border-white/12 bg-white/[0.04] px-2.5 py-1.5 text-xs font-medium text-zinc-200 transition-colors hover:border-white/20 hover:text-white disabled:cursor-not-allowed disabled:opacity-60"
            >
              <PhotoIcon className="h-3.5 w-3.5" aria-hidden />
              {isUploading
                ? 'Uploading…'
                : localPath
                  ? 'Replace photo'
                  : 'Add photo'}
            </button>
            {localPath ? (
              <button
                type="button"
                onClick={handleRemove}
                disabled={isUploading}
                className="inline-flex cursor-pointer items-center gap-1.5 rounded-lg px-2 py-1.5 text-xs font-medium text-zinc-500 transition-colors hover:text-red-300 disabled:cursor-not-allowed disabled:opacity-60"
              >
                <TrashIcon className="h-3.5 w-3.5" aria-hidden />
                Remove
              </button>
            ) : null}
          </div>
          {error ? <p className="mt-2 text-xs text-red-400">{error}</p> : null}
        </div>
      </div>
      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp,image/heic,image/heif"
        className="hidden"
        onChange={event => {
          const file = event.target.files?.[0];
          event.target.value = '';
          void handleFile(file);
        }}
      />
    </section>
  );
}
