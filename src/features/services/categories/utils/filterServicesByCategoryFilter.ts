import type { ServiceRow } from '@/features/services/types/services';
import { SERVICE_CATEGORY_UNCATEGORIZED_FILTER_ID } from '../types/serviceCategories';
import { sortServicesWithinBucket } from './sortServicesForDisplay';

/**
 * Returns services in the active category bucket, sorted within that bucket.
 */
export function filterServicesByCategoryFilter(
  services: ServiceRow[],
  activeFilterId: string
): ServiceRow[] {
  const bucket =
    activeFilterId === SERVICE_CATEGORY_UNCATEGORIZED_FILTER_ID
      ? services.filter(service => service.category_id == null)
      : services.filter(service => service.category_id === activeFilterId);

  return sortServicesWithinBucket(bucket);
}
