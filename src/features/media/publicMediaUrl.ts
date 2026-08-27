import { MEDIA_CONFIG } from './media.types';

const OBJECT_PUBLIC_SEGMENT = '/storage/v1/object/public/';
const RENDER_PUBLIC_SEGMENT = '/storage/v1/render/image/public/';

function publicObjectUrl(storagePath: string): string {
  const base = (process.env.NEXT_PUBLIC_SUPABASE_URL ?? '').replace(/\/$/, '');
  const path = storagePath.replace(/^\//, '');
  return `${base}${OBJECT_PUBLIC_SEGMENT}${MEDIA_CONFIG.bucketName}/${path}`;
}

/** Cacheable public object URL (no per-request cache-buster). */
export function getStablePublicMediaUrl(storagePath: string): string {
  if (
    storagePath.startsWith('http://') ||
    storagePath.startsWith('https://') ||
    storagePath.startsWith('blob:') ||
    storagePath.startsWith('data:')
  ) {
    return storagePath;
  }
  return publicObjectUrl(storagePath);
}

/**
 * Supabase image transform URL for a storage path or existing public object URL.
 * Falls back to the original URL when the path is not a Supabase object URL.
 */
export function getResizedPublicMediaUrl(
  storagePathOrUrl: string,
  options: { width: number; quality?: number }
): string {
  const url = getStablePublicMediaUrl(storagePathOrUrl);
  if (!url.includes(OBJECT_PUBLIC_SEGMENT)) return url;

  const [base] = url.split('?');
  const resized = base.replace(OBJECT_PUBLIC_SEGMENT, RENDER_PUBLIC_SEGMENT);
  const params = new URLSearchParams({
    width: String(options.width),
    quality: String(options.quality ?? 70),
    resize: 'cover',
  });
  return `${resized}?${params.toString()}`;
}
