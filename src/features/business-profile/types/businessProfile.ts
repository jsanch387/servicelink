/**
 * Business Profile Types
 *
 * Shared types for business profile functionality.
 * Single source of truth for business profile-related types.
 */

import { Database } from '@/libs/supabase/client';
import type { ServiceCategoryRow } from '@/features/services/categories/types/serviceCategories';

// Database types
export type BusinessProfileRow =
  Database['public']['Tables']['business_profiles']['Row'];
export type BusinessProfileInsert =
  Database['public']['Tables']['business_profiles']['Insert'];
export type BusinessProfileUpdate =
  Database['public']['Tables']['business_profiles']['Update'];

// Service types
export type BusinessServiceRow =
  Database['public']['Tables']['business_services']['Row'];
export type BusinessServiceInsert =
  Database['public']['Tables']['business_services']['Insert'];
export type BusinessServiceUpdate =
  Database['public']['Tables']['business_services']['Update'];

export type BusinessImageRow =
  Database['public']['Tables']['business_images']['Row'];
export type BusinessImageInsert =
  Database['public']['Tables']['business_images']['Insert'];
export type BusinessImageUpdate =
  Database['public']['Tables']['business_images']['Update'];

// UI/Form types
export interface BusinessProfileFormData {
  business_name: string;
  business_type: string;
  service_area: string;
  bio: string;
  phone_number_call: string;
  phone_number_text: string;
}

export interface ServiceFormData {
  id?: string;
  name: string;
  description: string;
  price: string; // Formatted string like "500"
  /** Form dropdown uses hours; prefer duration_minutes when present for display/save. */
  hours_to_complete: number | null;
  /** Stored in DB for new services; prioritized over hours_to_complete when reading. */
  duration_minutes?: number | null;
  isEditing?: boolean;
}

export interface PortfolioImageFormData {
  id?: string;
  storage_path: string;
  position: number;
  preview_url?: string;
}

// Complete business profile with related data
export interface CompleteBusinessProfile extends BusinessProfileRow {
  services: BusinessServiceRow[];
  /** Present when loaded from profile APIs; used for public category filters. */
  serviceCategories?: ServiceCategoryRow[];
  images: (BusinessImageRow & { preview_url?: string })[];
  logo_url?: string | null;
  cover_image_url?: string | null;
}

// API response types
export interface BusinessProfileResponse {
  success: boolean;
  data?: CompleteBusinessProfile;
  error?: string;
}

export interface ServiceResponse {
  success: boolean;
  data?: BusinessServiceRow[];
  error?: string;
}

export interface ImageResponse {
  success: boolean;
  data?: BusinessImageRow[];
  error?: string;
}

// Edit mode types
export type EditMode = 'view' | 'edit';

// Component props types
export interface BusinessProfileViewProps {
  businessProfile: CompleteBusinessProfile;
  onEdit: () => void;
}

export interface BusinessProfileEditProps {
  businessProfile: CompleteBusinessProfile;
  onSave: (data: Record<string, unknown>) => Promise<void>;
  onCancel: () => void;
  isLoading: boolean;
}
