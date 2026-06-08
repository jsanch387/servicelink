import type { FilterPillOption } from '@/components/shared';
import type { ServiceRow } from '@/features/services/types/services';
import {
  SERVICE_CATEGORY_UNCATEGORIZED_FILTER_ID,
  type ServiceCategoryRow,
} from '../types/serviceCategories';

function formatCategoryPillLabel(name: string, count: number): string {
  return `${name} ${count}`;
}

function countServicesInCategory(
  services: ServiceRow[],
  categoryId: string | null
): number {
  if (categoryId == null) {
    return services.filter(service => service.category_id == null).length;
  }
  return services.filter(service => service.category_id === categoryId).length;
}

/**
 * Builds filter pill options for the owner services list.
 * One pill per category (sorted), plus "No category" when any exist.
 */
export function buildServiceCategoryFilterOptions(
  categories: ServiceCategoryRow[],
  services: ServiceRow[]
): FilterPillOption<string>[] {
  const sorted = [...categories].sort((a, b) => {
    if (a.sort_order !== b.sort_order) return a.sort_order - b.sort_order;
    return a.created_at.localeCompare(b.created_at);
  });

  const options: FilterPillOption<string>[] = sorted.map(category => ({
    id: category.id,
    label: formatCategoryPillLabel(
      category.name,
      countServicesInCategory(services, category.id)
    ),
  }));

  const uncategorizedCount = countServicesInCategory(services, null);
  if (uncategorizedCount > 0) {
    options.push({
      id: SERVICE_CATEGORY_UNCATEGORIZED_FILTER_ID,
      label: formatCategoryPillLabel('No category', uncategorizedCount),
    });
  }

  return options;
}
