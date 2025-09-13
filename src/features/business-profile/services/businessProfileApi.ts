/**
 * Business Profile API Service
 *
 * Handles all business profile related API calls.
 * Clean, modular API operations for business profile feature.
 */

import { createClient } from '@/libs/supabase';
import { MediaService } from '@/features/media';
import {
  BusinessProfileResponse,
  CompleteBusinessProfile,
  BusinessProfileUpdate,
  ServiceResponse,
  ImageResponse,
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
      const supabase = createClient() as any;

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
          error: profileError?.message || 'Business profile not found' 
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
      const imagesWithUrls = (images || []).map((img: any) => ({
        ...img,
        preview_url: MediaService.getPublicUrl(img.storage_path),
      }));

      // Add logo and banner URLs if they exist
      const logoUrl = profile.logo_path ? MediaService.getPublicUrl(profile.logo_path) : null;
      const bannerUrl = profile.banner_path ? MediaService.getPublicUrl(profile.banner_path) : null;

      const completeProfile: CompleteBusinessProfile = {
        ...profile,
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
        error: error instanceof Error ? error.message : 'Unknown error' 
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
      const supabase = createClient() as any;

      const { data, error } = await supabase
        .from('business_profiles')
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
        error: error instanceof Error ? error.message : 'Unknown error' 
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
      description: string;
      price: number;
      hours_to_complete: number;
    }>
  ): Promise<ServiceResponse> {
    try {
      const supabase = createClient() as any;

      // Delete existing services
      await supabase
        .from('business_services')
        .delete()
        .eq('business_id', businessId);

      // Insert new services
      if (services.length > 0) {
        const servicesWithBusinessId = services.map(service => ({
          ...service,
          business_id: businessId,
        }));

        const { error: insertError } = await supabase
          .from('business_services')
          .insert(servicesWithBusinessId);

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
        error: error instanceof Error ? error.message : 'Unknown error' 
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
      alt_text?: string;
      position?: number;
    }>
  ): Promise<ImageResponse> {
    try {
      const supabase = createClient() as any;

      // Get current images from database
      const { data: currentImages, error: currentError } = await supabase
        .from('business_images')
        .select('storage_path')
        .eq('business_id', businessId);

      if (currentError) {
        console.error('Error fetching current images:', currentError);
        return { success: false, error: currentError.message };
      }

      const currentPaths = (currentImages || []).map((img: any) => img.storage_path);
      const newPaths = images.map(img => img.storage_path);
      const pathsToDelete = currentPaths.filter(
        (path: any) => !newPaths.includes(path)
      );

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
            error: storageError instanceof Error ? storageError.message : 'Storage deletion failed' 
          };
        }
      }

      // Delete all existing images from database
      await supabase
        .from('business_images')
        .delete()
        .eq('business_id', businessId);

      // Insert new images
      if (images.length > 0) {
        const imagesWithBusinessId = images.map((image, index) => {
          const imageData: any = {
            storage_path: image.storage_path,
            business_id: businessId,
            position: image.position ?? index,
          };
          
          // Only include id if it exists (for existing images)
          if (image.id) {
            imageData.id = image.id;
          }
          
          return imageData;
        });

        const { error: insertError } = await supabase
          .from('business_images')
          .insert(imagesWithBusinessId);

        if (insertError) {
          console.error('Error inserting images:', insertError);
          return { success: false, error: insertError.message };
        }
      }

      return { success: true };
    } catch (error) {
      console.error('Error in updateImages:', error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
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
      const supabase = createClient() as any;

      // Generate unique public_id
      const publicId = `business_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

      const { data, error } = await supabase
        .from('business_profiles')
        .insert({
          ...profileData,
          profile_id: profileId,
          public_id: publicId,
        })
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
        error: error instanceof Error ? error.message : 'Unknown error' 
      };
    }
  }
}