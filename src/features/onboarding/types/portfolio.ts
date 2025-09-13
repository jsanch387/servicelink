/**
 * Portfolio Types - Onboarding Feature
 *
 * Shared types for portfolio/gallery functionality.
 * Single source of truth for portfolio-related types.
 */

export interface PortfolioImage {
  id?: string;
  storage_path: string;
  position: number;
  preview_url?: string; // For UI preview before upload
}

export interface PortfolioImageRow {
  id: string;
  business_id: string;
  storage_path: string;
  position: number;
  created_at: string;
}

export interface PortfolioImageInsert {
  id?: string;
  business_id: string;
  storage_path: string;
  position: number;
  created_at?: string;
}

export interface PortfolioImageUpdate {
  id?: string;
  business_id?: string;
  storage_path?: string;
  position?: number;
  created_at?: string;
}

// For Step 4 form state
export interface PortfolioFormData {
  images: PortfolioImage[];
}

// For existing data from database
export interface PortfolioExistingData {
  images?: PortfolioImage[];
}
