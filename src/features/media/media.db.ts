/* eslint-disable @typescript-eslint/no-explicit-any */
/**
 * Media Database Operations
 *
 * Handles database operations for media-related data.
 * Manages business profile image paths and portfolio images.
 */

import { createClient } from '@/libs/supabase';

export class MediaDatabase {
  private static supabase = createClient();

  /**
   * Gets the current logo path for a business
   */
  static async getCurrentLogoPath(
    businessId: string
  ): Promise<{ success: boolean; logoPath?: string; error?: string }> {
    try {
      console.log('🔍 Getting current logo path:', { businessId });

      const { data, error } = await this.supabase
        .from('business_profiles')
        .select('logo_path')
        .eq('id', businessId)
        .single();

      if (error) {
        console.error('❌ Failed to get current logo path:', error);
        return { success: false, error: error.message };
      }

      console.log('✅ Current logo path retrieved:', (data as any)?.logo_path);
      return { success: true, logoPath: (data as any)?.logo_path };
    } catch (error) {
      console.error('❌ Error getting current logo path:', error);
      return {
        success: false,
        error:
          error instanceof Error ? error.message : 'Failed to get logo path',
      };
    }
  }

  /**
   * Gets the current banner path for a business
   */
  static async getCurrentBannerPath(
    businessId: string
  ): Promise<{ success: boolean; bannerPath?: string; error?: string }> {
    try {
      console.log('🔍 Getting current banner path:', { businessId });

      const { data, error } = await this.supabase
        .from('business_profiles')
        .select('banner_path')
        .eq('id', businessId)
        .single();

      if (error) {
        console.error('❌ Failed to get current banner path:', error);
        return { success: false, error: error.message };
      }

      console.log(
        '✅ Current banner path retrieved:',
        (data as any)?.banner_path
      );
      return { success: true, bannerPath: (data as any)?.banner_path };
    } catch (error) {
      console.error('❌ Error getting current banner path:', error);
      return {
        success: false,
        error:
          error instanceof Error ? error.message : 'Failed to get banner path',
      };
    }
  }

  /**
   * Updates business profile with new logo path
   */
  static async updateBusinessLogo(
    businessId: string,
    logoPath: string
  ): Promise<{ success: boolean; error?: string }> {
    try {
      console.log('🖼️ Updating business logo:', { businessId, logoPath });

      const { error } = await (this.supabase as any)
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

      const { error } = await (this.supabase as any)
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

        const { error: insertError } = await (this.supabase as any)
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
  static async getPortfolioImages(businessId: string): Promise<{
    success: boolean;
    data?: Record<string, unknown>[];
    error?: string;
  }> {
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

      console.log('✅ Portfolio images retrieved:', (data as any)?.length || 0);
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
