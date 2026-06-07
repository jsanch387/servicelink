import type { ServiceCategoryRow } from './categoryTypes';

export function getCategoryNameById(
  categories: ServiceCategoryRow[],
  categoryId: string | null | undefined
): string | null {
  if (!categoryId) return null;
  return categories.find(c => c.id === categoryId)?.name ?? null;
}
