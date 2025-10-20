/**
 * Media Storage Utilities
 *
 * Handles Supabase Storage operations for media files.
 * Provides upload, delete, and URL generation functionality.
 */

import { createClient } from '@/libs/supabase';
import { generateStoragePath } from './media.paths';
import { MEDIA_CONFIG, MediaType, UploadResult } from './media.types';

export class MediaStorage {
  private static supabase = createClient();

  /**
   * Uploads a file to Supabase Storage
   */
  static async uploadFile(
    file: File,
    storagePath: string,
    onProgress?: (_progress: number) => void
  ): Promise<UploadResult> {
    try {
      // Validate file
      const validation = this.validateFile(file);
      if (!validation.isValid) {
        return {
          success: false,
          error: validation.error,
        };
      }

      // Upload file
      const { data, error } = await this.supabase.storage
        .from(MEDIA_CONFIG.bucketName)
        .upload(storagePath, file, {
          cacheControl: '3600',
          upsert: false,
        });

      if (error) {
        return {
          success: false,
          error: error.message,
        };
      }

      // Generate public URL
      const publicUrl = this.getPublicUrl(storagePath);

      return {
        success: true,
        storagePath: data.path,
        publicUrl,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Upload failed',
      };
    }
  }

  /**
   * Gets public URL for a storage path with cache-busting
   */
  static getPublicUrl(
    storagePath: string,
    useCacheBuster: boolean = true
  ): string {
    const { data } = this.supabase.storage
      .from(MEDIA_CONFIG.bucketName)
      .getPublicUrl(storagePath);

    // Add cache-buster to prevent CDN caching issues after deletions/updates
    if (useCacheBuster) {
      return `${data.publicUrl}?v=${Date.now()}`;
    }

    return data.publicUrl;
  }

  /**
   * Deletes a single file from storage
   */
  static async deleteFile(
    storagePath: string
  ): Promise<{ success: boolean; error?: string }> {
    try {
      const { error } = await this.supabase.storage
        .from(MEDIA_CONFIG.bucketName)
        .remove([storagePath]);

      if (error) {
        return { success: false, error: error.message };
      }

      return { success: true };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to delete file',
      };
    }
  }

  /**
   * Deletes multiple files from storage
   */
  static async deleteFiles(
    storagePaths: string[]
  ): Promise<{ success: boolean; error?: string }> {
    if (storagePaths.length === 0) {
      return { success: true };
    }

    try {
      const { error } = await this.supabase.storage
        .from(MEDIA_CONFIG.bucketName)
        .remove(storagePaths);

      if (error) {
        return { success: false, error: error.message };
      }

      return { success: true };
    } catch (error) {
      return {
        success: false,
        error:
          error instanceof Error ? error.message : 'Failed to delete files',
      };
    }
  }

  /**
   * Validates a file before upload
   */
  private static validateFile(file: File): {
    isValid: boolean;
    error?: string;
  } {
    // Check file size
    if (file.size > MEDIA_CONFIG.maxFileSize) {
      return {
        isValid: false,
        error: `File size must be less than ${MEDIA_CONFIG.maxFileSize / (1024 * 1024)}MB`,
      };
    }

    // Check file type
    if (!MEDIA_CONFIG.allowedTypes.includes(file.type)) {
      return {
        isValid: false,
        error: `File type must be one of: ${MEDIA_CONFIG.allowedTypes.join(', ')}`,
      };
    }

    return { isValid: true };
  }

  /**
   * Uploads multiple files with progress tracking
   */
  static async uploadMultipleFiles(
    files: File[],
    businessId: string,
    mediaType: MediaType,
    onProgress?: (_fileIndex: number, _progress: number) => void
  ): Promise<UploadResult[]> {
    const results: UploadResult[] = [];

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const storagePath = generateStoragePath(businessId, mediaType, file);

      const result = await this.uploadFile(file, storagePath, progress => {
        onProgress?.(i, progress);
      });

      results.push(result);
    }

    return results;
  }
}
