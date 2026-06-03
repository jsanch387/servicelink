/**
 * Media Path Utilities
 *
 * Handles consistent path generation for media storage.
 * Ensures all paths follow the required conventions.
 */

import { v4 as uuidv4 } from 'uuid';
import { MediaType } from './media.types';

/**
 * Generates a storage path for a media file
 */
export function generateStoragePath(
  businessId: string,
  mediaType: MediaType,
  file: File
): string {
  const uuid = uuidv4();
  // Use the file's actual type to determine extension, not the filename
  const extension = getExtensionFromMimeType(file.type);

  switch (mediaType) {
    case 'logo':
      return `businesses/${businessId}/logo/${uuid}.${extension}`;
    case 'banner':
      return `businesses/${businessId}/banner/${uuid}.${extension}`;
    case 'portfolio':
      return `businesses/${businessId}/portfolio/${uuid}.${extension}`;
    default:
      throw new Error(`Unknown media type: ${mediaType}`);
  }
}

/**
 * Gets file extension from MIME type
 */
function getExtensionFromMimeType(mimeType: string): string {
  const mimeToExt: Record<string, string> = {
    'image/jpeg': 'jpg',
    'image/jpg': 'jpg',
    'image/png': 'png',
    'image/webp': 'webp',
    'image/heic': 'jpg', // HEIC files are converted to JPEG
    'image/heif': 'jpg', // HEIF files are converted to JPEG
  };

  return mimeToExt[mimeType.toLowerCase()] || 'jpg';
}

/**
 * Validates if a path follows the expected convention
 */
export function validateStoragePath(
  path: string,
  mediaType: MediaType
): boolean {
  const expectedPrefix = `businesses/`;
  const expectedSuffix =
    mediaType === 'portfolio' ? '/portfolio/' : `/${mediaType}/`;

  return path.startsWith(expectedPrefix) && path.includes(expectedSuffix);
}

/**
 * Extracts business ID from a storage path
 */
export function extractBusinessIdFromPath(path: string): string | null {
  const match = path.match(/^businesses\/([^\/]+)\//);
  return match ? match[1] : null;
}

/**
 * Extracts media type from a storage path
 */
export function extractMediaTypeFromPath(path: string): MediaType | null {
  if (path.includes('/logo/')) return 'logo';
  if (path.includes('/banner/')) return 'banner';
  if (path.includes('/portfolio/')) return 'portfolio';
  return null;
}
