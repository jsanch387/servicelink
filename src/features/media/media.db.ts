/**
 * Media Database Operations
 *
 * Handles database operations for media-related data.
 * Manages business profile image paths and portfolio images.
 */

import { createClient } from '@/libs/supabase';

export class MediaDatabase {
  private static supabase = createClient() as any;

  /**
   * Updates business profile with new logo path
   */
  static async updateBusinessLogo(
    businessId: string,
    logoPath: string
  ): Promise<{ success: boolean; error?: string }> {
    try {
      console.log('🖼️ Updating business logo:', { businessId, logoPath });

      const { error } = await this.supabase
        .from('business_profiles')
        .update({
          logo_path: logoPath,
          updated_at: new Date().toISOString(),
        })
        .eq('id', businessId);

      if (error) {
        console.error('❌ Failed to update business logo:', error);
        return { success: false, error: error.message };
      }

      console.log('✅ Business logo updated successfully');
      return { success: true };
    } catch (error) {
      console.error('❌ Error updating business logo:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to update logo',
      };
    }
  }

  /**
   * Updates business profile with new banner path
   */
  static async updateBusinessBanner(
    businessId: string,
    bannerPath: string
  ): Promise<{ success: boolean; error?: string }> {
    try {
      console.log('🖼️ Updating business banner:', { businessId, bannerPath });

      const { error } = await this.supabase
        .from('business_profiles')
        .update({
          banner_path: bannerPath,
          updated_at: new Date().toISOString(),
        })
        .eq('id', businessId);

      if (error) {
        console.error('❌ Failed to update business banner:', error);
        return { success: false, error: error.message };
      }

      console.log('✅ Business banner updated successfully');
      return { success: true };
    } catch (error) {
      console.error('❌ Error updating business banner:', error);
      return {
        success: false,
        error:
          error instanceof Error ? error.message : 'Failed to update banner',
      };
    }
  }

  /**
   * Updates portfolio images for a business
   */
  static async updatePortfolioImages(
    businessId: string,
    images: Array<{
      storagePath: string;
      position: number;
    }>
  ): Promise<{ success: boolean; error?: string }> {
    try {
      console.log('🖼️ Updating portfolio images:', {
        businessId,
        imagesCount: images.length,
      });

      // First, delete all existing portfolio images
      const { error: deleteError } = await this.supabase
        .from('business_images')
        .delete()
        .eq('business_id', businessId);

      if (deleteError) {
        console.error(
          '❌ Failed to delete existing portfolio images:',
          deleteError
        );
        return { success: false, error: deleteError.message };
      }

      // Insert new portfolio images
      if (images.length > 0) {
        const imagesToInsert = images.map(image => ({
          business_id: businessId,
          storage_path: image.storagePath,
          position: image.position,
        }));

        const { error: insertError } = await this.supabase
          .from('business_images')
          .insert(imagesToInsert);

        if (insertError) {
          console.error('❌ Failed to insert portfolio images:', insertError);
          return { success: false, error: insertError.message };
        }
      }

      console.log('✅ Portfolio images updated successfully');
      return { success: true };
    } catch (error) {
      console.error('❌ Error updating portfolio images:', error);
      return {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : 'Failed to update portfolio images',
      };
    }
  }

  /**
   * Gets portfolio images for a business
   */
  static async getPortfolioImages(
    businessId: string
  ): Promise<{ success: boolean; data?: any[]; error?: string }> {
    try {
      console.log('📸 Getting portfolio images for business:', businessId);

      const { data, error } = await this.supabase
        .from('business_images')
        .select('*')
        .eq('business_id', businessId)
        .order('position', { ascending: true });

      if (error) {
        console.error('❌ Failed to get portfolio images:', error);
        return { success: false, error: error.message };
      }

      console.log('✅ Portfolio images retrieved:', data?.length || 0);
      return { success: true, data: data || [] };
    } catch (error) {
      console.error('❌ Error getting portfolio images:', error);
      return {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : 'Failed to get portfolio images',
      };
    }
  }

  /**
   * Deletes a portfolio image
   */
  static async deletePortfolioImage(
    imageId: string
  ): Promise<{ success: boolean; error?: string }> {
    try {
      console.log('🗑️ Deleting portfolio image:', imageId);

      const { error } = await this.supabase
        .from('business_images')
        .delete()
        .eq('id', imageId);

      if (error) {
        console.error('❌ Failed to delete portfolio image:', error);
        return { success: false, error: error.message };
      }

      console.log('✅ Portfolio image deleted successfully');
      return { success: true };
    } catch (error) {
      console.error('❌ Error deleting portfolio image:', error);
      return {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : 'Failed to delete portfolio image',
      };
    }
  }
}
