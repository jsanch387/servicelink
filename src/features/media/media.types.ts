/**
 * Media Feature Types
 *
 * Type definitions for the media upload and management system.
 * Used by both Onboarding and Edit Profile features.
 */

export interface MediaFile {
  id: string;
  file: File;
  preview: string;
  storagePath?: string;
  publicUrl?: string;
  position?: number;
}

export interface UploadResult {
  success: boolean;
  storagePath?: string;
  publicUrl?: string;
  error?: string;
}

export interface MediaUploadState {
  isUploading: boolean;
  progress: number;
  error: string | null;
  result: UploadResult | null;
}

export interface LogoUploadData {
  businessId: string;
  file: File;
  previousPath?: string;
}

export interface BannerUploadData {
  businessId: string;
  file: File;
  previousPath?: string;
}

export interface PortfolioUploadData {
  businessId: string;
  files: File[];
  previousImages?: Array<{
    id: string;
    storagePath: string;
    position: number;
  }>;
}

export interface MediaConfig {
  bucketName: string;
  maxFileSize: number; // in bytes
  allowedTypes: string[];
  maxPortfolioImages: number;
}

export const MEDIA_CONFIG: MediaConfig = {
  bucketName: 'business_images',
  maxFileSize: 5 * 1024 * 1024, // 5MB
  allowedTypes: ['image/jpeg', 'image/png', 'image/webp'],
  maxPortfolioImages: 10,
};

export type MediaType = 'logo' | 'banner' | 'portfolio';
