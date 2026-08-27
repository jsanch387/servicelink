import {
  getResizedPublicMediaUrl,
  getStablePublicMediaUrl,
} from '@/features/media/publicMediaUrl';
import { getServiceImagePath } from './serviceImage';

export function getServiceImageUrl(
  service: { image_path?: string | null } | null | undefined,
  options?: { width?: number; quality?: number }
): string | null {
  const path = getServiceImagePath(service);
  if (!path) return null;
  if (options?.width) {
    return getResizedPublicMediaUrl(path, {
      width: options.width,
      quality: options.quality,
    });
  }
  return getStablePublicMediaUrl(path);
}
