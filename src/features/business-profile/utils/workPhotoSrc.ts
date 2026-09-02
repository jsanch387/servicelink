export type WorkPhotoSource = {
  id?: string;
  preview_url?: string | null;
  storage_path?: string | null;
};

export type WorkPhoto = {
  id: string;
  src: string;
  thumbSrc: string;
};

export const GALLERY_INITIAL_VISIBLE = 4;
export const GALLERY_VISIBLE_BATCH = 4;
export const GALLERY_THUMB_SIZE = 640;
export const GALLERY_THUMB_QUALITY = 70;
export const GALLERY_PRIORITY_COUNT = 2;

const PUBLIC_BUSINESS_IMAGES_PREFIX =
  'https://qailotbnrtwyzhbwufvk.supabase.co/storage/v1/object/public/business_images/';
const STORAGE_OBJECT_PUBLIC = '/storage/v1/object/public/';
const STORAGE_RENDER_PUBLIC = '/storage/v1/render/image/public/';

export function stripWorkPhotoCacheBuster(src: string): string {
  try {
    const url = new URL(src);
    const version = url.searchParams.get('v');
    if (version && /^\d+$/.test(version)) {
      url.searchParams.delete('v');
    }
    return url.toString();
  } catch {
    return src;
  }
}

export function getWorkPhotoSrc(image: WorkPhotoSource): string {
  const preview = image.preview_url?.trim();
  if (preview) return stripWorkPhotoCacheBuster(preview);
  const path = image.storage_path?.trim();
  if (path) return `${PUBLIC_BUSINESS_IMAGES_PREFIX}${path}`;
  return '';
}

export function getWorkPhotoThumbSrc(src: string): string {
  if (!src || src.startsWith('blob:') || src.startsWith('data:')) return src;
  try {
    const url = new URL(src);
    if (!url.pathname.includes(STORAGE_OBJECT_PUBLIC)) return src;
    url.pathname = url.pathname.replace(
      STORAGE_OBJECT_PUBLIC,
      STORAGE_RENDER_PUBLIC
    );
    url.search = '';
    url.searchParams.set('width', String(GALLERY_THUMB_SIZE));
    url.searchParams.set('height', String(GALLERY_THUMB_SIZE));
    url.searchParams.set('resize', 'cover');
    url.searchParams.set('quality', String(GALLERY_THUMB_QUALITY));
    return url.toString();
  } catch {
    return src;
  }
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
      thumbSrc: getWorkPhotoThumbSrc(src),
    });
  }
  return photos;
}
