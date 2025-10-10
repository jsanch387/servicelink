/**
 * Business Images Service - Onboarding Feature
 *
 * Handles CRUD operations for business_images table.
 * Clean, modular image management for portfolio/gallery.
 */

/* eslint-disable @typescript-eslint/no-explicit-any */
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
    console.log('🖼️ Getting images for business:', businessId);

    try {
      const supabase = createClient() as any;

      const { data, error } = await supabase
        .from('business_images')
        .select('*')
        .eq('business_id', businessId)
        .order('position', { ascending: true });

      if (error) {
        console.error('❌ Failed to get images:', error);
        return { success: false, error: error.message };
      }

      // Convert database rows to frontend format
      const images: PortfolioImage[] = data.map((row: PortfolioImageRow) => ({
        id: row.id,
        storage_path: row.storage_path,
        position: row.position,
        preview_url: row.storage_path, // For now, use storage_path as preview
      }));

      console.log('✅ Images retrieved:', images.length);
      return { success: true, data: images };
    } catch (error) {
      console.error('❌ Error getting images:', error);
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
    console.log('➕ Creating image for business:', businessId, image);

    try {
      const supabase = createClient() as any;

      const imageData: PortfolioImageInsert = {
        business_id: businessId,
        storage_path: image.storage_path,
        position: image.position,
      };

      const { data, error } = await supabase
        .from('business_images')
        .insert(imageData)
        .select()
        .single();

      if (error) {
        console.error('❌ Failed to create image:', error);
        return { success: false, error: error.message };
      }

      console.log('✅ Image created:', data.id);
      return { success: true, data };
    } catch (error) {
      console.error('❌ Error creating image:', error);
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
    console.log('📝 Updating image:', imageId, image);

    try {
      const supabase = createClient() as any;

      const updateData: any = {};
      if (image.storage_path !== undefined)
        updateData.storage_path = image.storage_path;
      if (image.position !== undefined) updateData.position = image.position;

      const { data, error } = await supabase
        .from('business_images')
        .update(updateData)
        .eq('id', imageId)
        .select()
        .single();

      if (error) {
        console.error('❌ Failed to update image:', error);
        return { success: false, error: error.message };
      }

      console.log('✅ Image updated:', data.id);
      return { success: true, data };
    } catch (error) {
      console.error('❌ Error updating image:', error);
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
    console.log('🗑️ Deleting image:', imageId);

    try {
      const supabase = createClient() as any;

      const { error } = await supabase
        .from('business_images')
        .delete()
        .eq('id', imageId);

      if (error) {
        console.error('❌ Failed to delete image:', error);
        return { success: false, error: error.message };
      }

      console.log('✅ Image deleted:', imageId);
      return { success: true };
    } catch (error) {
      console.error('❌ Error deleting image:', error);
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
    console.log(
      '📦 Creating images for onboarding:',
      businessId,
      images.length
    );

    try {
      const supabase = createClient() as any;

      if (images.length === 0) {
        console.log('ℹ️ No images to create');
        return { success: true, data: [] };
      }

      const imagesData: PortfolioImageInsert[] = images.map(image => ({
        business_id: businessId,
        storage_path: image.storage_path,
        position: image.position,
      }));

      const { data, error } = await supabase
        .from('business_images')
        .insert(imagesData)
        .select();

      if (error) {
        console.error('❌ Failed to create images:', error);
        return { success: false, error: error.message };
      }

      console.log('✅ Images created for onboarding:', data.length);
      return { success: true, data };
    } catch (error) {
      console.error('❌ Error creating images for onboarding:', error);
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
    console.log('🔄 Updating image positions:', imagePositions);

    try {
      const supabase = createClient() as any;

      // Update each image position
      for (const { id, position } of imagePositions) {
        const { error } = await supabase
          .from('business_images')
          .update({ position })
          .eq('id', id)
          .eq('business_id', businessId);

        if (error) {
          console.error('❌ Failed to update image position:', error);
          return { success: false, error: error.message };
        }
      }

      console.log('✅ Image positions updated');
      return { success: true };
    } catch (error) {
      console.error('❌ Error updating image positions:', error);
      return {
        success: false,
        error:
          error instanceof Error ? error.message : 'Failed to update positions',
      };
    }
  }
}
