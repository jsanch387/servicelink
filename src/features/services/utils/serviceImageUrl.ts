import { MediaService } from '@/features/media';
import { getServiceImagePath } from './serviceImage';

export function getServiceImageUrl(
  service: { image_path?: string | null } | null | undefined
): string | null {
  const path = getServiceImagePath(service);
  return path ? MediaService.getPublicUrl(path) : null;
}
