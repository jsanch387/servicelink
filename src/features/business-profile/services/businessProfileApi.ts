/**
 * Business Profile API Service
 *
 * Handles all business profile related API calls.
 * Clean, modular API operations for business profile feature.
 */

import { MediaService } from '@/features/media';
import { createClient } from '@/libs/supabase';
import {
  BusinessProfileResponse,
  BusinessProfileUpdate,
  CompleteBusinessProfile,
  ImageResponse,
  ServiceResponse,
} from '../types/businessProfile';

export class BusinessProfileApi {
  /**
   * Gets a complete business profile with all related data
   */
  static async getCompleteBusinessProfile(businessId: string): Promise<{
    success: boolean;
    data?: CompleteBusinessProfile;
    error?: string;
  }> {
    try {
      const supabase = createClient();

      // Get business profile
      const { data: profile, error: profileError } = await supabase
        .from('business_profiles')
        .select('*')
        .eq('id', businessId)
        .single();

      if (profileError || !profile) {
        console.error('Error fetching business profile:', profileError);
        return {
          success: false,
          error: profileError?.message || 'Business profile not found',
        };
      }

      // Get services
      const { data: services, error: servicesError } = await supabase
        .from('business_services')
        .select('*')
        .eq('business_id', businessId)
        .order('created_at', { ascending: true });

      if (servicesError) {
        console.error('Error fetching services:', servicesError);
      }

      // Get images
      const { data: images, error: imagesError } = await supabase
        .from('business_images')
        .select('*')
        .eq('business_id', businessId)
        .order('created_at', { ascending: true });

      if (imagesError) {
        console.error('Error fetching images:', imagesError);
      }

      // Add preview URLs to images
      const imagesWithUrls = (images || []).map(
        (img: Record<string, unknown>) => ({
          ...img,
          preview_url: MediaService.getPublicUrl(img.storage_path as string),
        })
      );

      // Add logo and banner URLs if they exist
      const logoUrl = (profile as any).logo_path
        ? MediaService.getPublicUrl((profile as any).logo_path)
        : null;
      const bannerUrl = (profile as any).banner_path
        ? MediaService.getPublicUrl((profile as any).banner_path)
        : null;

      const completeProfile: CompleteBusinessProfile = {
        ...(profile as any),
        services: services || [],
        images: imagesWithUrls || [],
        logo_url: logoUrl,
        cover_image_url: bannerUrl,
      };

      return { success: true, data: completeProfile };
    } catch (error) {
      console.error('Error in getCompleteBusinessProfile:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * Updates a business profile
   */
  static async updateBusinessProfile(
    businessId: string,
    updates: BusinessProfileUpdate
  ): Promise<BusinessProfileResponse> {
    try {
      const supabase = createClient();

      const { data, error } = await (supabase.from('business_profiles') as any)
        .update({
          ...updates,
          updated_at: new Date().toISOString(),
        })
        .eq('id', businessId)
        .select()
        .single();

      if (error) {
        console.error('Error updating business profile:', error);
        return { success: false, error: error.message };
      }

      return { success: true, data };
    } catch (error) {
      console.error('Error in updateBusinessProfile:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * Updates services for a business
   */
  static async updateServices(
    businessId: string,
    services: Array<{
      id?: string;
      name: string;
      description: string | null;
      price_cents: number;
      hours_to_complete: number | null;
      is_active: boolean;
    }>
  ): Promise<ServiceResponse> {
    try {
      const supabase = createClient();

      // Validate all services before making any changes
      for (const service of services) {
        if (!service.name || service.name.trim() === '') {
          return {
            success: false,
            error: 'Service name is required',
          };
        }
        if (service.price_cents === null || service.price_cents === undefined) {
          return {
            success: false,
            error: 'Service price is required',
          };
        }
      }

      // Simple approach: Delete all existing services and insert all current services
      // This ensures consistency and avoids complex update logic

      // First, delete all existing services for this business
      const { error: deleteError } = await supabase
        .from('business_services')
        .delete()
        .eq('business_id', businessId);

      if (deleteError) {
        console.error('Error deleting existing services:', deleteError);
        return { success: false, error: deleteError.message };
      }

      // Then insert all current services (without ID field to let DB auto-generate)
      if (services.length > 0) {
        const servicesToInsert = services.map(service => ({
          name: service.name,
          description: service.description,
          price_cents: service.price_cents,
          hours_to_complete: service.hours_to_complete,
          business_id: businessId,
          is_active: service.is_active,
        }));

        const { error: insertError } = await (
          supabase.from('business_services') as any
        ).insert(servicesToInsert);

        if (insertError) {
          console.error('Error inserting services:', insertError);
          return { success: false, error: insertError.message };
        }
      }

      return { success: true };
    } catch (error) {
      console.error('Error in updateServices:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * Updates images for a business
   */
  static async updateImages(
    businessId: string,
    images: Array<{
      id?: string;
      storage_path: string;
      position?: number;
    }>
  ): Promise<ImageResponse> {
    try {
      const supabase = createClient();

      // Get current images from database
      const { data: currentImages, error: currentError } = await supabase
        .from('business_images')
        .select('storage_path')
        .eq('business_id', businessId);

      if (currentError) {
        console.error('Error fetching current images:', currentError);
        return { success: false, error: currentError.message };
      }

      const currentPaths = (currentImages || []).map(
        (img: Record<string, unknown>) => img.storage_path
      );
      const newPaths = images.map(img => img.storage_path);
      const pathsToDelete = currentPaths.filter(
        (path: unknown) => typeof path === 'string' && !newPaths.includes(path)
      ) as string[];

      // Delete unused images from storage
      if (pathsToDelete.length > 0) {
        try {
          const deleteResult = await MediaService.deleteImages(pathsToDelete);

          if (!deleteResult.success) {
            console.error('Failed to delete images:', deleteResult.error);
            return { success: false, error: deleteResult.error };
          }

          console.log('Successfully deleted unused images from storage');
        } catch (storageError) {
          console.error('Exception during storage deletion:', storageError);
          return {
            success: false,
            error:
              storageError instanceof Error
                ? storageError.message
                : 'Storage deletion failed',
          };
        }
      }

      // Delete all existing images from database
      await supabase
        .from('business_images')
        .delete()
        .eq('business_id', businessId);

      // Insert new images (without ID field to let database auto-generate)
      if (images.length > 0) {
        const imagesToInsert = images.map((image, index) => ({
          storage_path: image.storage_path,
          business_id: businessId,
          position: image.position ?? index,
        }));

        const { error: insertError } = await supabase
          .from('business_images')
          .insert(imagesToInsert as any);

        if (insertError) {
          console.error('Error inserting images:', insertError);

          // If database insert fails, clean up the uploaded files from storage
          const newImagePaths = images.map(img => img.storage_path);
          try {
            console.log(
              '🧹 Cleaning up uploaded files due to database insert failure...'
            );
            await MediaService.deleteImages(newImagePaths);
            console.log('✅ Successfully cleaned up uploaded files');
          } catch (cleanupError) {
            console.error(
              '❌ Failed to clean up uploaded files:',
              cleanupError
            );
          }

          return { success: false, error: insertError.message };
        }
      }

      return { success: true };
    } catch (error) {
      console.error('Error in updateImages:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * Creates a new business profile
   */
  static async createBusinessProfile(
    profileId: string,
    profileData: {
      business_name: string;
      business_type: string;
      service_area: string;
      bio: string;
      phone_number_call?: string;
      phone_number_text?: string;
      website?: string;
      instagram?: string;
      facebook?: string;
      logo_url?: string;
      cover_image_url?: string;
    }
  ): Promise<BusinessProfileResponse> {
    try {
      const supabase = createClient();

      // Generate unique public_id
      const publicId = `business_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

      const { data, error } = await supabase
        .from('business_profiles')
        .insert({
          ...profileData,
          profile_id: profileId,
          public_id: publicId,
        } as any)
        .select()
        .single();

      if (error) {
        console.error('Error creating business profile:', error);
        return { success: false, error: error.message };
      }

      return { success: true, data };
    } catch (error) {
      console.error('Error in createBusinessProfile:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }
}
