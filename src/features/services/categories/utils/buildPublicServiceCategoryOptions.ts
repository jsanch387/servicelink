import type { ServiceRow } from '@/features/services/types/services';
import {
  SERVICE_CATEGORY_UNCATEGORIZED_FILTER_ID,
  type ServiceCategoryRow,
} from '../types/serviceCategories';
import { shouldShowServiceCategoryFilters } from './shouldShowServiceCategoryFilters';

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

/**
 * Category tabs for the public profile services section.
 * Returns empty when the business has no categories configured.
 */
export function buildPublicServiceCategoryOptions(
  categories: ServiceCategoryRow[],
  services: ServiceRow[],
  uncategorizedLabel: string
): PublicServiceCategoryOption[] {
  if (categories.length === 0) return [];

  const sorted = [...categories].sort(compareCategories);
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
 * Hidden when there is only one meaningful filter (e.g. one category and all
 * services belong to it).
 */
export function shouldShowPublicServiceCategoryFilters(
  categories: ServiceCategoryRow[],
  services: Pick<ServiceRow, 'category_id'>[]
): boolean {
  return shouldShowServiceCategoryFilters(categories, services);
}
