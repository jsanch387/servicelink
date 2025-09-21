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
      console.log('🖼️ Starting logo upload:', {
        businessId: data.businessId,
        fileName: data.file.name,
        previousPath: data.previousPath,
      });

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
        console.log('🗑️ Deleting old logo from storage:', currentLogoPath);
        try {
          await MediaStorage.deleteFile(currentLogoPath);
          console.log('✅ Old logo deleted successfully');
        } catch (deleteError) {
          console.warn(
            '⚠️ Failed to delete old logo (continuing with upload):',
            deleteError
          );
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
        console.log('🧹 Cleaning up newly uploaded logo due to DB failure');
        await MediaStorage.deleteFile(newStoragePath);
        return {
          success: false,
          error: dbResult.error,
        };
      }

      console.log('✅ Logo upload completed successfully');
      return {
        success: true,
        storagePath: newStoragePath,
        publicUrl: uploadResult.publicUrl,
      };
    } catch (error) {
      console.error('❌ Logo upload error:', error);
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
      console.log('🖼️ Starting banner upload:', {
        businessId: data.businessId,
        fileName: data.file.name,
        previousPath: data.previousPath,
      });

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
        console.log('🗑️ Deleting old banner from storage:', currentBannerPath);
        try {
          await MediaStorage.deleteFile(currentBannerPath);
          console.log('✅ Old banner deleted successfully');
        } catch (deleteError) {
          console.warn(
            '⚠️ Failed to delete old banner (continuing with upload):',
            deleteError
          );
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
        console.log('🧹 Cleaning up newly uploaded banner due to DB failure');
        await MediaStorage.deleteFile(newStoragePath);
        return {
          success: false,
          error: dbResult.error,
        };
      }

      console.log('✅ Banner upload completed successfully');
      return {
        success: true,
        storagePath: newStoragePath,
        publicUrl: uploadResult.publicUrl,
      };
    } catch (error) {
      console.error('❌ Banner upload error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Banner upload failed',
      };
    }
  }

  /**
   * Uploads and saves portfolio images
   */
  static async uploadPortfolio(
    data: PortfolioUploadData
  ): Promise<UploadResult[]> {
    try {
      console.log('🖼️ Starting portfolio upload:', {
        businessId: data.businessId,
        filesCount: data.files.length,
      });

      const results: UploadResult[] = [];
      const successfulUploads: Array<{
        storagePath: string;
        position: number;
      }> = [];

      // Upload each file
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
        console.log('🧹 Cleaning up successful uploads due to failures');
        for (const upload of successfulUploads) {
          await MediaStorage.deleteFile(upload.storagePath);
        }
        return results;
      }

      // Note: Database update is handled by the calling component
      // We only handle storage upload here
      console.log('✅ Portfolio images uploaded to storage successfully');

      // Update results with public URLs
      for (let i = 0; i < results.length; i++) {
        if (results[i].success) {
          results[i].publicUrl = MediaStorage.getPublicUrl(
            successfulUploads[i].storagePath
          );
        }
      }

      console.log('✅ Portfolio upload completed successfully');
      return results;
    } catch (error) {
      console.error('❌ Portfolio upload error:', error);
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
      console.log('🗑️ Deleting portfolio image:', {
        businessId,
        imageId,
        storagePath,
      });

      // Delete from database first
      const dbResult = await MediaDatabase.deletePortfolioImage(imageId);
      if (!dbResult.success) {
        return dbResult;
      }

      // Delete from storage
      const storageResult = await MediaStorage.deleteFile(storagePath);
      if (!storageResult.success) {
        console.warn(
          '⚠️ Failed to delete from storage, but DB deletion succeeded'
        );
      }

      console.log('✅ Portfolio image deleted successfully');
      return { success: true };
    } catch (error) {
      console.error('❌ Portfolio image deletion error:', error);
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
    console.log('🗑️ MEDIA: Deleting image from storage:', storagePath);

    try {
      const result = await MediaStorage.deleteFile(storagePath);

      if (result.success) {
        console.log('✅ MEDIA: Image deleted successfully from storage');
        return { success: true };
      } else {
        console.error(
          '❌ MEDIA: Failed to delete image from storage:',
          result.error
        );
        return { success: false, error: result.error };
      }
    } catch (error) {
      console.error('❌ MEDIA: Error deleting image from storage:', error);
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
    console.log(
      '🗑️ MEDIA: Deleting multiple images from storage:',
      storagePaths
    );

    if (storagePaths.length === 0) {
      return { success: true };
    }

    try {
      const result = await MediaStorage.deleteFiles(storagePaths);

      if (result.success) {
        console.log('✅ MEDIA: Images deleted successfully from storage');
        return { success: true };
      } else {
        console.error(
          '❌ MEDIA: Failed to delete images from storage:',
          result.error
        );
        return { success: false, error: result.error };
      }
    } catch (error) {
      console.error('❌ MEDIA: Error deleting images from storage:', error);
      return {
        success: false,
        error:
          error instanceof Error ? error.message : 'Failed to delete images',
      };
    }
  }
}
