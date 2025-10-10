/**
 * Slug Service - Handles business profile slug creation and validation
 * Features:
 * - Slug generation and validation
 * - Uniqueness checking
 * - Database updates
 * - Comprehensive logging
 */

/* eslint-disable @typescript-eslint/no-explicit-any */
import { createClient } from '@/libs/supabase/client';

const APP_DOMAIN = 'myservicelink.app';

// Types for slug operations
export interface SlugValidationResult {
  isValid: boolean;
  error?: string;
  cleanSlug?: string;
}

export interface SlugAvailabilityResult {
  isAvailable: boolean;
  error?: string;
}

export interface CreateSlugResult {
  success: boolean;
  error?: string;
  data?: {
    slug: string;
    fullLink: string;
    businessProfileId: string;
  };
}

export interface BusinessSlugData {
  business_slug: string;
  business_link: string;
  updated_at: string;
}

class SlugService {
  private supabase = createClient();

  /**
   * Generate a URL-friendly slug from business name
   */
  generateSlugFromName(businessName: string): string {
    console.log(
      '🏷️ [SlugService] Generating slug from business name:',
      businessName
    );

    const slug = businessName
      .toLowerCase()
      .trim()
      // Replace spaces and special characters with hyphens
      .replace(/[\s_]+/g, '-')
      // Remove all non-alphanumeric characters except hyphens
      .replace(/[^a-z0-9-]/g, '')
      // Replace multiple consecutive hyphens with single hyphen
      .replace(/-+/g, '-')
      // Remove leading and trailing hyphens
      .replace(/^-|-$/g, '');

    console.log('✅ [SlugService] Generated slug:', slug);
    return slug;
  }

  /**
   * Validate user input slug
   */
  validateSlug(rawInput: string): SlugValidationResult {
    console.log('🔍 [SlugService] Validating slug input:', rawInput);

    const trimmed = rawInput.trim();

    if (!trimmed) {
      console.log('❌ [SlugService] Validation failed: Empty input');
      return {
        isValid: false,
        error: 'Please enter a name for your link. It cannot be empty.',
      };
    }

    // Clean the input to create the actual slug
    const cleanSlug = this.generateSlugFromName(trimmed);

    if (!cleanSlug) {
      console.log('❌ [SlugService] Validation failed: No valid characters');
      return {
        isValid: false,
        error: 'Your input contains no valid characters for a link.',
      };
    }

    if (cleanSlug.length < 3) {
      console.log('❌ [SlugService] Validation failed: Too short');
      return {
        isValid: false,
        error: 'Your link name needs to be at least 3 letters long.',
      };
    }

    if (cleanSlug.length > 50) {
      console.log('❌ [SlugService] Validation failed: Too long');
      return {
        isValid: false,
        error: 'Your link name is too long. Please use 50 letters or less.',
      };
    }

    // Check for reserved slugs
    const reservedSlugs = [
      'admin',
      'api',
      'app',
      'www',
      'mail',
      'ftp',
      'blog',
      'shop',
      'store',
      'help',
      'support',
      'contact',
      'about',
      'terms',
      'privacy',
      'login',
      'signup',
      'dashboard',
      'profile',
      'settings',
      'account',
      'billing',
      'prolink-services',
      'admin-link',
    ];

    if (reservedSlugs.includes(cleanSlug)) {
      console.log('❌ [SlugService] Validation failed: Reserved slug');
      return {
        isValid: false,
        error: 'This link name is reserved and cannot be used.',
      };
    }

    console.log('✅ [SlugService] Validation passed:', cleanSlug);
    return {
      isValid: true,
      cleanSlug,
    };
  }

  /**
   * Check if a slug is available (not already in use)
   */
  async checkSlugAvailability(slug: string): Promise<SlugAvailabilityResult> {
    console.log('🔍 [SlugService] Checking availability for slug:', slug);

    try {
      const { data, error } = await this.supabase
        .from('business_profiles')
        .select('id, business_name')
        .eq('business_slug', slug)
        .single();

      if (error && error.code !== 'PGRST116') {
        // PGRST116 is "not found" which is what we want
        console.error(
          '❌ [SlugService] Database error checking availability:',
          error
        );
        return {
          isAvailable: false,
          error: 'Unable to check if link name is available. Please try again.',
        };
      }

      if (data) {
        console.log(
          '❌ [SlugService] Slug already taken by:',
          (data as any).business_name
        );
        return {
          isAvailable: false,
          error:
            'Sorry, this link name is already taken. Please try a different one.',
        };
      }

      console.log('✅ [SlugService] Slug is available:', slug);
      return {
        isAvailable: true,
      };
    } catch (error) {
      console.error(
        '❌ [SlugService] Unexpected error checking availability:',
        error
      );
      return {
        isAvailable: false,
        error: 'Unable to check link name availability. Please try again.',
      };
    }
  }

  /**
   * Create and save a slug for a business profile
   */
  async createBusinessSlug(
    businessProfileId: string,
    rawSlugInput: string
  ): Promise<CreateSlugResult> {
    console.log('🚀 [SlugService] Creating slug for business profile:', {
      businessProfileId,
      rawSlugInput,
    });

    // Step 1: Validate the input
    const validation = this.validateSlug(rawSlugInput);
    if (!validation.isValid) {
      console.log('❌ [SlugService] Validation failed:', validation.error);
      return {
        success: false,
        error: validation.error,
      };
    }

    const cleanSlug = validation.cleanSlug!;

    // Step 2: Check availability
    const availability = await this.checkSlugAvailability(cleanSlug);
    if (!availability.isAvailable) {
      console.log(
        '❌ [SlugService] Availability check failed:',
        availability.error
      );
      return {
        success: false,
        error: availability.error,
      };
    }

    // Step 3: Generate full link
    const fullLink = `${APP_DOMAIN}/${cleanSlug}`;
    console.log('🔗 [SlugService] Generated full link:', fullLink);

    // Step 4: Update database
    try {
      const { data, error } = await (this.supabase as any)
        .from('business_profiles')
        .update({
          business_slug: cleanSlug,
          business_link: fullLink,
          updated_at: new Date().toISOString(),
        })
        .eq('id', businessProfileId)
        .select('id, business_name, business_slug, business_link')
        .single();

      if (error) {
        console.error('❌ [SlugService] Database update failed:', error);
        return {
          success: false,
          error: 'Failed to save your link. Please try again.',
        };
      }

      console.log('✅ [SlugService] Slug created successfully:', {
        businessProfileId: data.id,
        businessName: data.business_name,
        slug: data.business_slug,
        link: data.business_link,
      });

      return {
        success: true,
        data: {
          slug: data.business_slug!,
          fullLink: data.business_link!,
          businessProfileId: data.id,
        },
      };
    } catch (error) {
      console.error('❌ [SlugService] Unexpected error creating slug:', error);
      return {
        success: false,
        error: 'An unexpected error occurred. Please try again.',
      };
    }
  }

  /**
   * Get existing slug data for a business profile
   */
  async getBusinessSlug(
    businessProfileId: string
  ): Promise<BusinessSlugData | null> {
    console.log(
      '📖 [SlugService] Getting slug data for business profile:',
      businessProfileId
    );

    try {
      const { data, error } = await this.supabase
        .from('business_profiles')
        .select('business_slug, business_link, updated_at')
        .eq('id', businessProfileId)
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          console.log(
            'ℹ️ [SlugService] No slug data found for business profile'
          );
          return null;
        }
        console.error('❌ [SlugService] Error getting slug data:', error);
        return null;
      }

      if (!(data as any).business_slug || !(data as any).business_link) {
        console.log('ℹ️ [SlugService] Business profile has no slug configured');
        return null;
      }

      console.log('✅ [SlugService] Retrieved slug data:', {
        slug: (data as any).business_slug,
        link: (data as any).business_link,
        updated: (data as any).updated_at,
      });

      return {
        business_slug: (data as any).business_slug,
        business_link: (data as any).business_link,
        updated_at: (data as any).updated_at,
      };
    } catch (error) {
      console.error(
        '❌ [SlugService] Unexpected error getting slug data:',
        error
      );
      return null;
    }
  }

  /**
   * Increment profile view count (for analytics)
   */
  async incrementProfileViews(slug: string): Promise<void> {
    console.log('📊 [SlugService] Incrementing view count for slug:', slug);

    try {
      const { error } = await (this.supabase as any)
        .from('business_profiles')
        .update({
          profile_views: (this.supabase as any).raw('profile_views + 1'),
          last_viewed_at: new Date().toISOString(),
        })
        .eq('business_slug', slug);

      if (error) {
        console.error(
          '❌ [SlugService] Failed to increment view count:',
          error
        );
      } else {
        console.log('✅ [SlugService] View count incremented for slug:', slug);
      }
    } catch (error) {
      console.error(
        '❌ [SlugService] Unexpected error incrementing views:',
        error
      );
    }
  }

  /**
   * Get business profile by slug (for public viewing)
   */
  async getBusinessProfileBySlug(slug: string) {
    console.log('🔍 [SlugService] Getting business profile by slug:', slug);

    try {
      const { data, error } = await this.supabase
        .from('business_profiles')
        .select('*')
        .eq('business_slug', slug)
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          console.log(
            '❌ [SlugService] Business profile not found for slug:',
            slug
          );
          return null;
        }
        console.error(
          '❌ [SlugService] Error getting business profile by slug:',
          error
        );
        return null;
      }

      console.log('✅ [SlugService] Retrieved business profile:', {
        id: (data as any).id,
        businessName: (data as any).business_name,
        slug: (data as any).business_slug,
      });

      return data;
    } catch (error) {
      console.error(
        '❌ [SlugService] Unexpected error getting business profile by slug:',
        error
      );
      return null;
    }
  }
}

// Export singleton instance
export const slugService = new SlugService();

// Export for testing
export { SlugService };
