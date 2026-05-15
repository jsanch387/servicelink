/**
 * Business Images Service - Onboarding Feature
 *
 * Handles CRUD operations for business_images table.
 * Clean, modular image management for portfolio/gallery.
 */

/* eslint-disable @typescript-eslint/no-explicit-any */
import { resolveMaxPortfolioImagesForBusiness } from '@/features/business-profile/server/resolveMaxPortfolioImagesForBusiness';
import { createClient } from '@/libs/supabase';
import {
  PortfolioImage,
  PortfolioImageInsert,
  PortfolioImageRow,
} from '../types/portfolio';

export class BusinessImagesService {
  /**
   * Gets all images for a business profile
   */
  static async getImagesByBusinessId(businessId: string): Promise<{
    success: boolean;
    data?: PortfolioImage[];
    error?: string;
  }> {
    try {
      const supabase = createClient();

      const { data, error } = await supabase
        .from('business_images')
        .select('*')
        .eq('business_id', businessId)
        .order('position', { ascending: true });

      if (error) {
        return { success: false, error: error.message };
      }

      // Convert database rows to frontend format
      const images: PortfolioImage[] = data.map((row: PortfolioImageRow) => ({
        id: row.id,
        storage_path: row.storage_path,
        position: row.position,
        preview_url: row.storage_path, // For now, use storage_path as preview
      }));

      return { success: true, data: images };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to get images',
      };
    }
  }

  /**
   * Creates a new image entry for a business
   */
  static async createImage(
    businessId: string,
    image: PortfolioImage
  ): Promise<{
    success: boolean;
    data?: PortfolioImageRow;
    error?: string;
  }> {
    try {
      const supabase = createClient();

      const imageData: PortfolioImageInsert = {
        business_id: businessId,
        storage_path: image.storage_path,
        position: image.position,
      };

      const { data, error } = await supabase
        .from('business_images')
        .insert(imageData as any)
        .select()
        .single();

      if (error) {
        return { success: false, error: error.message };
      }

      return { success: true, data };
    } catch (error) {
      return {
        success: false,
        error:
          error instanceof Error ? error.message : 'Failed to create image',
      };
    }
  }

  /**
   * Updates an existing image
   */
  static async updateImage(
    imageId: string,
    image: Partial<PortfolioImage>
  ): Promise<{
    success: boolean;
    data?: PortfolioImageRow;
    error?: string;
  }> {
    try {
      const supabase = createClient();

      const updateData: any = {};
      if (image.storage_path !== undefined)
        updateData.storage_path = image.storage_path;
      if (image.position !== undefined) updateData.position = image.position;

      const { data, error } = await supabase
        .from('business_images')
        .update(updateData as never)
        .eq('id', imageId)
        .select()
        .single();

      if (error) {
        return { success: false, error: error.message };
      }

      return { success: true, data };
    } catch (error) {
      return {
        success: false,
        error:
          error instanceof Error ? error.message : 'Failed to update image',
      };
    }
  }

  /**
   * Deletes an image
   */
  static async deleteImage(imageId: string): Promise<{
    success: boolean;
    error?: string;
  }> {
    try {
      const supabase = createClient();

      const { error } = await supabase
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
          error instanceof Error ? error.message : 'Failed to delete image',
      };
    }
  }

  /**
   * Bulk creates images for onboarding
   */
  static async createImagesForOnboarding(
    businessId: string,
    images: PortfolioImage[]
  ): Promise<{
    success: boolean;
    data?: PortfolioImageRow[];
    error?: string;
  }> {
    try {
      const supabase = createClient();

      if (images.length === 0) {
        return { success: true, data: [] };
      }

      const maxPortfolio = await resolveMaxPortfolioImagesForBusiness(
        supabase as any,
        businessId
      );
      if (images.length > maxPortfolio) {
        return {
          success: false,
          error: `You can add up to ${maxPortfolio} portfolio images on your current plan.`,
        };
      }

      const imagesData: PortfolioImageInsert[] = images.map(image => ({
        business_id: businessId,
        storage_path: image.storage_path,
        position: image.position,
      }));

      const { data, error } = await supabase
        .from('business_images')
        .insert(imagesData as any)
        .select();

      if (error) {
        return { success: false, error: error.message };
      }

      return { success: true, data };
    } catch (error) {
      return {
        success: false,
        error:
          error instanceof Error ? error.message : 'Failed to create images',
      };
    }
  }

  /**
   * Updates image positions (for reordering)
   */
  static async updateImagePositions(
    businessId: string,
    imagePositions: { id: string; position: number }[]
  ): Promise<{
    success: boolean;
    error?: string;
  }> {
    try {
      const supabase = createClient();

      // Update each image position
      for (const { id, position } of imagePositions) {
        const { error } = await supabase
          .from('business_images')
          .update({ position } as never)
          .eq('id', id)
          .eq('business_id', businessId);

        if (error) {
          return { success: false, error: error.message };
        }
      }

      return { success: true };
    } catch (error) {
      return {
        success: false,
        error:
          error instanceof Error ? error.message : 'Failed to update positions',
      };
    }
  }
}
