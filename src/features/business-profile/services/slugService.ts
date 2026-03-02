/**
 * Slug Service - Handles business profile slug creation and validation
 * Features:
 * - Slug generation and validation
 * - Uniqueness checking
 * - Database updates
 * - Comprehensive logging
 */

/* eslint-disable @typescript-eslint/no-explicit-any */
import { SLUG_MAX_LENGTH } from '@/constants/slug';
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
   * Generate a URL-friendly slug from business name.
   * Always returns lowercase (a-z, 0-9, hyphens only) for consistent DB storage.
   */
  generateSlugFromName(businessName: string): string {
    const slug = businessName
      .toLowerCase()
      .trim()
      // Replace spaces and underscores with hyphens
      .replace(/[\s_]+/g, '-')
      // Remove all non-alphanumeric characters except hyphens
      .replace(/[^a-z0-9-]/g, '')
      // Collapse multiple consecutive hyphens
      .replace(/-+/g, '-')
      // Remove leading and trailing hyphens
      .replace(/^-|-$/g, '')
      .slice(0, SLUG_MAX_LENGTH);

    return slug;
  }

  /**
   * Validate user input slug
   */
  validateSlug(rawInput: string): SlugValidationResult {
    const trimmed = rawInput.trim();

    if (!trimmed) {
      return {
        isValid: false,
        error: 'Please enter a name for your link. It cannot be empty.',
      };
    }

    // Clean the input to create the actual slug
    const cleanSlug = this.generateSlugFromName(trimmed);

    if (!cleanSlug) {
      return {
        isValid: false,
        error: 'Your input contains no valid characters for a link.',
      };
    }

    if (cleanSlug.length < 3) {
      return {
        isValid: false,
        error: 'Your link name needs to be at least 3 letters long.',
      };
    }

    if (cleanSlug.length > SLUG_MAX_LENGTH) {
      return {
        isValid: false,
        error: `Your link name is too long. Please use ${SLUG_MAX_LENGTH} characters or less.`,
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
      return {
        isValid: false,
        error: 'This link name is reserved and cannot be used.',
      };
    }

    return {
      isValid: true,
      cleanSlug,
    };
  }

  /**
   * Check if a slug is available (not already in use)
   */
  async checkSlugAvailability(slug: string): Promise<SlugAvailabilityResult> {
    try {
      const { data, error } = await this.supabase
        .from('business_profiles')
        .select('id, business_name')
        .eq('business_slug', slug)
        .single();

      if (error && error.code !== 'PGRST116') {
        // PGRST116 is "not found" which is what we want
        return {
          isAvailable: false,
          error: 'Unable to check if link name is available. Please try again.',
        };
      }

      if (data) {
        return {
          isAvailable: false,
          error:
            'Sorry, this link name is already taken. Please try a different one.',
        };
      }

      return {
        isAvailable: true,
      };
    } catch {
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
    // Step 1: Validate the input
    const validation = this.validateSlug(rawSlugInput);
    if (!validation.isValid) {
      return {
        success: false,
        error: validation.error,
      };
    }

    // Always store lowercase in DB (defensive; cleanSlug is already from generateSlugFromName)
    const cleanSlug = validation.cleanSlug!.toLowerCase();

    // Step 2: Check availability
    const availability = await this.checkSlugAvailability(cleanSlug);
    if (!availability.isAvailable) {
      return {
        success: false,
        error: availability.error,
      };
    }

    // Step 3: Generate full link
    const fullLink = `${APP_DOMAIN}/${cleanSlug}`;

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
        return {
          success: false,
          error: 'Failed to save your link. Please try again.',
        };
      }

      return {
        success: true,
        data: {
          slug: data.business_slug!,
          fullLink: data.business_link!,
          businessProfileId: data.id,
        },
      };
    } catch {
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
    try {
      const { data, error } = await this.supabase
        .from('business_profiles')
        .select('business_slug, business_link, updated_at')
        .eq('id', businessProfileId)
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          return null;
        }
        return null;
      }

      if (!(data as any).business_slug || !(data as any).business_link) {
        return null;
      }

      return {
        business_slug: (data as any).business_slug,
        business_link: (data as any).business_link,
        updated_at: (data as any).updated_at,
      };
    } catch {
      return null;
    }
  }

  /**
   * Increment profile view count (for analytics)
   */
  async incrementProfileViews(slug: string): Promise<void> {
    try {
      const { error } = await (this.supabase as any)
        .from('business_profiles')
        .update({
          profile_views: (this.supabase as any).raw('profile_views + 1'),
          last_viewed_at: new Date().toISOString(),
        })
        .eq('business_slug', slug);

      if (error) {
        // Failed to increment view count
      }
    } catch {
      // Unexpected error incrementing views
    }
  }

  /**
   * Get business profile by slug (for public viewing)
   */
  async getBusinessProfileBySlug(slug: string) {
    try {
      const { data, error } = await this.supabase
        .from('business_profiles')
        .select('*')
        .eq('business_slug', slug)
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          return null;
        }
        return null;
      }

      return data;
    } catch {
      return null;
    }
  }
}

// Export singleton instance
export const slugService = new SlugService();

// Export for testing
export { SlugService };
