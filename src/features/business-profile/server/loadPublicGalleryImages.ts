import { MediaService } from '@/features/media';
import type { Database } from '@/libs/supabase/client';
import type { SupabaseClient } from '@supabase/supabase-js';
import type {
  BusinessImageRow,
  CompleteBusinessProfile,
} from '../types/businessProfile';
import { resolveMaxPortfolioImagesForBusiness } from './resolveMaxPortfolioImagesForBusiness';

export type PublicGalleryImage = CompleteBusinessProfile['images'][number];

/**
 * Portfolio images for the public Gallery tab (capped by owner plan).
 * Uses admin after the route has confirmed the slug is publicly visible.
 */
export async function loadPublicGalleryImages(
  admin: SupabaseClient<Database>,
  businessId: string
): Promise<PublicGalleryImage[]> {
  const id = businessId?.trim();
  if (!id) return [];

  const { data, error } = await admin
    .from('business_images')
    .select('*')
    .eq('business_id', id)
    .order('position', { ascending: true });

  if (error) {
    console.error('[gallery] loadPublicGalleryImages query failed', error);
    return [];
  }

  const maxPortfolio = await resolveMaxPortfolioImagesForBusiness(admin, id);
  const rows = ((data ?? []) as BusinessImageRow[]).slice(0, maxPortfolio);

  return rows.map(img => ({
    ...img,
    preview_url: MediaService.getPublicUrl(img.storage_path, false),
  }));
}
