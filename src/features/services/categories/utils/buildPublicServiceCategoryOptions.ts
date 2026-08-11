import type { ServiceRow } from '@/features/services/types/services';
import {
  SERVICE_CATEGORY_UNCATEGORIZED_FILTER_ID,
  type ServiceCategoryRow,
} from '../types/serviceCategories';

export interface PublicServiceCategoryOption {
  id: string;
  label: string;
}

function compareCategories(
  a: ServiceCategoryRow,
  b: ServiceCategoryRow
): number {
  if (a.sort_order !== b.sort_order) return a.sort_order - b.sort_order;
  return a.created_at.localeCompare(b.created_at);
}

function categoryIdsWithServices(
  services: Pick<ServiceRow, 'category_id'>[]
): Set<string> {
  const ids = new Set<string>();
  for (const service of services) {
    const id = service.category_id?.trim();
    if (id) ids.add(id);
  }
  return ids;
}

/**
 * Category tabs for the public profile / booking services section.
 * Omits categories with zero services (empty tabs look broken).
 * Returns empty when there are no non-empty categories.
 */
export function buildPublicServiceCategoryOptions(
  categories: ServiceCategoryRow[],
  services: Pick<ServiceRow, 'category_id'>[],
  uncategorizedLabel: string
): PublicServiceCategoryOption[] {
  if (categories.length === 0) return [];

  const withServices = categoryIdsWithServices(services);
  const sorted = [...categories]
    .filter(category => withServices.has(category.id))
    .sort(compareCategories);

  if (sorted.length === 0) return [];

  const options: PublicServiceCategoryOption[] = sorted.map(category => ({
    id: category.id,
    label: category.name,
  }));

  const hasUncategorized = services.some(
    service => service.category_id == null
  );
  if (hasUncategorized) {
    options.push({
      id: SERVICE_CATEGORY_UNCATEGORIZED_FILTER_ID,
      label: uncategorizedLabel,
    });
  }

  return options;
}

/**
 * Whether public booking link / profile services should show category tabs.
 * Uses only categories that actually have services (empty categories ignored).
 * Hidden when there is only one meaningful filter (e.g. one populated category
 * and all services belong to it).
 */
export function shouldShowPublicServiceCategoryFilters(
  categories: ServiceCategoryRow[],
  services: Pick<ServiceRow, 'category_id'>[]
): boolean {
  const withServices = categoryIdsWithServices(services);
  const nonEmptyCount = categories.reduce(
    (count, category) => count + (withServices.has(category.id) ? 1 : 0),
    0
  );
  if (nonEmptyCount === 0) return false;
  if (nonEmptyCount >= 2) return true;
  return services.some(service => service.category_id == null);
}
