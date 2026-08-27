import {
  getResizedPublicMediaUrl,
  getStablePublicMediaUrl,
} from '@/features/media/publicMediaUrl';

export function resolveGallerySourceUrl(image: {
  storage_path?: string | null;
  preview_url?: string | null;
}): string {
  const previewUrl = image.preview_url?.trim() || '';
  if (previewUrl.startsWith('blob:') || previewUrl.startsWith('data:')) {
    return previewUrl;
  }
  const storagePath = image.storage_path?.trim();
  if (storagePath) {
    return getStablePublicMediaUrl(storagePath);
  }
  return previewUrl;
}

export interface PublicGalleryImage {
  id: string;
  fullSrc: string;
  thumbSrc: string;
  heroSrc: string;
  alt: string;
}

export function buildPublicGalleryImages(
  images: Array<{
    id?: string | null;
    storage_path?: string | null;
    preview_url?: string | null;
  }>,
  altPrefix: string
): PublicGalleryImage[] {
  return images.map((image, index) => {
    const fullSrc = resolveGallerySourceUrl(image);
    return {
      id: image.id || `image-${index}`,
      fullSrc,
      thumbSrc: fullSrc
        ? getResizedPublicMediaUrl(fullSrc, { width: 720, quality: 70 })
        : '',
      heroSrc: fullSrc
        ? getResizedPublicMediaUrl(fullSrc, { width: 1200, quality: 72 })
        : '',
      alt: `${altPrefix} ${index + 1}`,
    };
  });
}
