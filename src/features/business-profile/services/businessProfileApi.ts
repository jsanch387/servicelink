/**
 * Business Profile API Service
 *
 * Handles all business profile related API calls.
 * Clean, modular API operations for business profile feature.
 */

import { resolveMaxPortfolioImagesForBusiness } from '@/features/business-profile/server/resolveMaxPortfolioImagesForBusiness';
import { MediaService } from '@/features/media';
/* eslint-disable @typescript-eslint/no-explicit-any */
import { createClient } from '@/libs/supabase';
import {
  BusinessProfileResponse,
  BusinessProfileUpdate,
  CompleteBusinessProfile,
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
      const supabase = createClient();

      // Get business profile
      const { data: profile, error: profileError } = await supabase
        .from('business_profiles')
        .select('*')
        .eq('id', businessId)
        .single();

      if (profileError || !profile) {
        return {
          success: false,
          error: profileError?.message || 'Business profile not found',
        };
      }

      // Get services (order by sort_order then created_at for consistent display)
      const { data: services, error: servicesError } = await supabase
        .from('business_services')
        .select('*')
        .eq('business_id', businessId)
        .order('sort_order', { ascending: true, nullsFirst: false })
        .order('created_at', { ascending: true });

      if (servicesError) {
        // Error fetching services
      }

      // Get images
      const { data: images, error: imagesError } = await supabase
        .from('business_images')
        .select('*')
        .eq('business_id', businessId)
        .order('created_at', { ascending: true });

      if (imagesError) {
        // Error fetching images
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
        return { success: false, error: error.message };
      }

      return { success: true, data };
    } catch (error) {
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

      const maxPortfolio = await resolveMaxPortfolioImagesForBusiness(
        supabase as any,
        businessId
      );
      if (images.length > maxPortfolio) {
        return {
          success: false,
          error:
            maxPortfolio <= 4
              ? `Free plan includes up to ${maxPortfolio} gallery images. Remove extras or upgrade to Pro for up to 8.`
              : `You can save up to ${maxPortfolio} gallery images.`,
        };
      }

      // Get current images from database
      const { data: currentImages, error: currentError } = await supabase
        .from('business_images')
        .select('storage_path')
        .eq('business_id', businessId);

      if (currentError) {
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
            return { success: false, error: deleteResult.error };
          }
        } catch (storageError) {
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
          // If database insert fails, clean up the uploaded files from storage
          const newImagePaths = images.map(img => img.storage_path);
          try {
            await MediaService.deleteImages(newImagePaths);
          } catch {
            // Failed to clean up uploaded files
          }

          return { success: false, error: insertError.message };
        }
      }

      return { success: true };
    } catch (error) {
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
        return { success: false, error: error.message };
      }

      return { success: true, data };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }
}
