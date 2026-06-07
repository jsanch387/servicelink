import type { ServiceCategoryRow } from '../types/serviceCategories';

type ServiceWithCategory = { category_id: string | null };

/**
 * Whether the owner services list should show category filter pills.
 * Matches mobile / contract rules.
 */
export function shouldShowServiceCategoryFilters(
  categories: Pick<ServiceCategoryRow, 'id'>[],
  services: ServiceWithCategory[]
): boolean {
  if (categories.length === 0) return false;
  if (categories.length >= 2) return true;
  return services.some(service => service.category_id == null);
}
