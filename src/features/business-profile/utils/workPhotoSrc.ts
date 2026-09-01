export type WorkPhotoSource = {
  id?: string;
  preview_url?: string | null;
  storage_path?: string | null;
};

export type WorkPhoto = {
  id: string;
  src: string;
};

const PUBLIC_BUSINESS_IMAGES_PREFIX =
  'https://qailotbnrtwyzhbwufvk.supabase.co/storage/v1/object/public/business_images/';

export function getWorkPhotoSrc(image: WorkPhotoSource): string {
  const preview = image.preview_url?.trim();
  if (preview) return preview;
  const path = image.storage_path?.trim();
  if (path) return `${PUBLIC_BUSINESS_IMAGES_PREFIX}${path}`;
  return '';
}

export function toWorkPhotos(
  images: WorkPhotoSource[] | null | undefined
): WorkPhoto[] {
  if (!images?.length) return [];
  const photos: WorkPhoto[] = [];
  for (let index = 0; index < images.length; index += 1) {
    const image = images[index];
    const src = getWorkPhotoSrc(image);
    if (!src) continue;
    photos.push({
      id: image.id?.trim() || `work-${index}`,
      src,
    });
  }
  return photos;
}
