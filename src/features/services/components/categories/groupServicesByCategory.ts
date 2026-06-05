import type { ServiceRow } from '@/features/services/types/services';
import type { ServiceCategoryRow } from './categoryTypes';

export interface ServiceCategoryGroup {
  category: ServiceCategoryRow | null;
  services: ServiceRow[];
}

/**
 * Groups services by category for the dashboard list.
 * Uncategorized services appear last under a null category.
 */
export function groupServicesByCategory(
  services: ServiceRow[],
  categories: ServiceCategoryRow[],
  serviceCategoryIds: Record<string, string | null>
): ServiceCategoryGroup[] {
  const sortedCategories = [...categories].sort(
    (a, b) => a.sort_order - b.sort_order
  );

  const byCategoryId = new Map<string | null, ServiceRow[]>();
  for (const category of sortedCategories) {
    byCategoryId.set(category.id, []);
  }
  byCategoryId.set(null, []);

  for (const service of services) {
    const categoryId = serviceCategoryIds[service.id] ?? null;
    const bucket =
      categoryId != null && byCategoryId.has(categoryId)
        ? categoryId
        : null;
    byCategoryId.get(bucket)!.push(service);
  }

  const groups: ServiceCategoryGroup[] = sortedCategories
    .filter(c => (byCategoryId.get(c.id)?.length ?? 0) > 0)
    .map(c => ({
      category: c,
      services: byCategoryId.get(c.id)!,
    }));

  const uncategorized = byCategoryId.get(null) ?? [];
  if (uncategorized.length > 0) {
    groups.push({ category: null, services: uncategorized });
  }

  return groups;
}

export function getCategoryNameById(
  categories: ServiceCategoryRow[],
  categoryId: string | null | undefined
): string | null {
  if (!categoryId) return null;
  return categories.find(c => c.id === categoryId)?.name ?? null;
}
