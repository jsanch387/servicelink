/**
 * Media Service
 *
 * High-level service that orchestrates media operations.
 * Combines storage and database operations for complete media management.
 */

import { MediaDatabase } from './media.db';
import { generateStoragePath } from './media.paths';
import { MediaStorage } from './media.storage';
import {
  BannerUploadData,
  LogoUploadData,
  PortfolioUploadData,
  UploadResult,
} from './media.types';

export class MediaService {
  /**
   * Uploads and saves a business logo
   * Replaces the existing logo (deletes old one from storage)
   */
  static async uploadLogo(data: LogoUploadData): Promise<UploadResult> {
    try {
      // Get current logo path from database to delete old logo
      const currentLogoResult = await MediaDatabase.getCurrentLogoPath(
        data.businessId
      );
      const currentLogoPath = currentLogoResult.success
        ? currentLogoResult.logoPath
        : data.previousPath;

      // Generate new storage path
      const newStoragePath = generateStoragePath(
        data.businessId,
        'logo',
        data.file
      );

      // Delete old logo from storage if it exists
      if (currentLogoPath && currentLogoPath.trim()) {
        try {
          await MediaStorage.deleteFile(currentLogoPath);
        } catch {
          // Don't fail the entire operation if old logo deletion fails
        }
      }

      // Upload new logo to storage
      const uploadResult = await MediaStorage.uploadFile(
        data.file,
        newStoragePath
      );
      if (!uploadResult.success) {
        return uploadResult;
      }

      // Update database with new logo path
      const dbResult = await MediaDatabase.updateBusinessLogo(
        data.businessId,
        newStoragePath
      );
      if (!dbResult.success) {
        // If DB update fails, clean up the newly uploaded file
        await MediaStorage.deleteFile(newStoragePath);
        return {
          success: false,
          error: dbResult.error,
        };
      }

      return {
        success: true,
        storagePath: newStoragePath,
        publicUrl: uploadResult.publicUrl,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Logo upload failed',
      };
    }
  }

  /**
   * Uploads and saves a business banner
   * Replaces the existing banner (deletes old one from storage)
   */
  static async uploadBanner(data: BannerUploadData): Promise<UploadResult> {
    try {
      // Get current banner path from database to delete old banner
      const currentBannerResult = await MediaDatabase.getCurrentBannerPath(
        data.businessId
      );
      const currentBannerPath = currentBannerResult.success
        ? currentBannerResult.bannerPath
        : data.previousPath;

      // Generate new storage path
      const newStoragePath = generateStoragePath(
        data.businessId,
        'banner',
        data.file
      );

      // Delete old banner from storage if it exists
      if (currentBannerPath && currentBannerPath.trim()) {
        try {
          await MediaStorage.deleteFile(currentBannerPath);
        } catch {
          // Don't fail the entire operation if old banner deletion fails
        }
      }

      // Upload new banner to storage
      const uploadResult = await MediaStorage.uploadFile(
        data.file,
        newStoragePath
      );
      if (!uploadResult.success) {
        return uploadResult;
      }

      // Update database with new banner path
      const dbResult = await MediaDatabase.updateBusinessBanner(
        data.businessId,
        newStoragePath
      );
      if (!dbResult.success) {
        // If DB update fails, clean up the newly uploaded file
        await MediaStorage.deleteFile(newStoragePath);
        return {
          success: false,
          error: dbResult.error,
        };
      }

      return {
        success: true,
        storagePath: newStoragePath,
        publicUrl: uploadResult.publicUrl,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Banner upload failed',
      };
    }
  }

  /**
   * Uploads and saves portfolio images
   * Automatically converts HEIC/HEIF files to JPEG before upload
   */
  static async uploadPortfolio(
    data: PortfolioUploadData
  ): Promise<UploadResult[]> {
    try {
      const results: UploadResult[] = [];
      const successfulUploads: Array<{
        storagePath: string;
        position: number;
      }> = [];

      // Upload each file (HEIC conversion is handled automatically by MediaStorage)
      for (let i = 0; i < data.files.length; i++) {
        const file = data.files[i];
        const storagePath = generateStoragePath(
          data.businessId,
          'portfolio',
          file
        );

        const uploadResult = await MediaStorage.uploadFile(file, storagePath);
        results.push(uploadResult);

        if (uploadResult.success) {
          successfulUploads.push({
            storagePath,
            position: i,
          });
        }
      }

      // If any uploads failed, clean up successful ones
      const failedUploads = results.filter(r => !r.success);
      if (failedUploads.length > 0) {
        for (const upload of successfulUploads) {
          await MediaStorage.deleteFile(upload.storagePath);
        }
        return results;
      }

      // Note: Database update is handled by the calling component
      // We only handle storage upload here

      // Update results with public URLs
      for (let i = 0; i < results.length; i++) {
        if (results[i].success) {
          results[i].publicUrl = MediaStorage.getPublicUrl(
            successfulUploads[i].storagePath
          );
        }
      }

      return results;
    } catch (error) {
      return data.files.map(() => ({
        success: false,
        error:
          error instanceof Error ? error.message : 'Portfolio upload failed',
      }));
    }
  }

  /**
   * Deletes a portfolio image
   */
  static async deletePortfolioImage(
    businessId: string,
    imageId: string,
    storagePath: string
  ): Promise<{ success: boolean; error?: string }> {
    try {
      // Delete from database first
      const dbResult = await MediaDatabase.deletePortfolioImage(imageId);
      if (!dbResult.success) {
        return dbResult;
      }

      // Delete from storage
      const storageResult = await MediaStorage.deleteFile(storagePath);
      if (!storageResult.success) {
        // Failed to delete from storage, but DB deletion succeeded
      }

      return { success: true };
    } catch (error) {
      return {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : 'Failed to delete portfolio image',
      };
    }
  }

  /**
   * Gets public URL for a storage path
   */
  static getPublicUrl(storagePath: string): string {
    return MediaStorage.getPublicUrl(storagePath);
  }

  /**
   * Deletes a single image from storage
   */
  static async deleteImage(
    storagePath: string
  ): Promise<{ success: boolean; error?: string }> {
    try {
      const result = await MediaStorage.deleteFile(storagePath);

      if (result.success) {
        return { success: true };
      } else {
        return { success: false, error: result.error };
      }
    } catch (error) {
      return {
        success: false,
        error:
          error instanceof Error ? error.message : 'Failed to delete image',
      };
    }
  }

  /**
   * Deletes multiple images from storage
   */
  static async deleteImages(
    storagePaths: string[]
  ): Promise<{ success: boolean; error?: string }> {
    if (storagePaths.length === 0) {
      return { success: true };
    }

    try {
      const result = await MediaStorage.deleteFiles(storagePaths);

      if (result.success) {
        return { success: true };
      } else {
        return { success: false, error: result.error };
      }
    } catch (error) {
      return {
        success: false,
        error:
          error instanceof Error ? error.message : 'Failed to delete images',
      };
    }
  }
}
