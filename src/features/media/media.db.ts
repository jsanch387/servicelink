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
      const { data, error } = await this.supabase
        .from('business_profiles')
        .select('logo_path')
        .eq('id', businessId)
        .single();

      if (error) {
        return { success: false, error: error.message };
      }

      return { success: true, logoPath: (data as any)?.logo_path };
    } catch (error) {
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
      const { data, error } = await this.supabase
        .from('business_profiles')
        .select('banner_path')
        .eq('id', businessId)
        .single();

      if (error) {
        return { success: false, error: error.message };
      }

      return { success: true, bannerPath: (data as any)?.banner_path };
    } catch (error) {
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
      const { error } = await (this.supabase as any)
        .from('business_profiles')
        .update({
          logo_path: logoPath,
          updated_at: new Date().toISOString(),
        })
        .eq('id', businessId);

      if (error) {
        return { success: false, error: error.message };
      }

      return { success: true };
    } catch (error) {
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
      const { error } = await (this.supabase as any)
        .from('business_profiles')
        .update({
          banner_path: bannerPath,
          updated_at: new Date().toISOString(),
        })
        .eq('id', businessId);

      if (error) {
        return { success: false, error: error.message };
      }

      return { success: true };
    } catch (error) {
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
      // First, delete all existing portfolio images
      const { error: deleteError } = await this.supabase
        .from('business_images')
        .delete()
        .eq('business_id', businessId);

      if (deleteError) {
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
          return { success: false, error: insertError.message };
        }
      }

      return { success: true };
    } catch (error) {
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
      const { data, error } = await this.supabase
        .from('business_images')
        .select('*')
        .eq('business_id', businessId)
        .order('position', { ascending: true });

      if (error) {
        return { success: false, error: error.message };
      }

      return { success: true, data: data || [] };
    } catch (error) {
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
      const { error } = await this.supabase
        .from('business_images')
        .delete()
        .eq('id', imageId);

      if (error) {
        return { success: false, error: error.message };
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
}
