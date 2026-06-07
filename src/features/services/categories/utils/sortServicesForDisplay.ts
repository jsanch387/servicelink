import type { ServiceRow } from '@/features/services/types/services';
import type { ServiceCategoryRow } from '../types/serviceCategories';

/** sort_order for a service at index within its category bucket (mobile parity). */
export function sortOrderForBucketIndex(index: number): number {
  return index * 10;
}

/** Within one category bucket: sort_order ASC (nulls last), created_at, name. */
export function compareServicesWithinBucket(
  a: ServiceRow,
  b: ServiceRow
): number {
  const aOrder = a.sort_order;
  const bOrder = b.sort_order;

  if (aOrder != null && bOrder != null) {
    if (aOrder !== bOrder) return aOrder - bOrder;
  } else if (aOrder != null) {
    return -1;
  } else if (bOrder != null) {
    return 1;
  }

  const created = a.created_at.localeCompare(b.created_at);
  if (created !== 0) return created;

  return a.name.localeCompare(b.name);
}

export function sortServicesWithinBucket(services: ServiceRow[]): ServiceRow[] {
  return [...services].sort(compareServicesWithinBucket);
}

function compareCategories(
  a: ServiceCategoryRow,
  b: ServiceCategoryRow
): number {
  if (a.sort_order !== b.sort_order) return a.sort_order - b.sort_order;
  return a.created_at.localeCompare(b.created_at);
}

/**
 * Flattens services for display: category sections in sort_order, then
 * within-bucket service order. Uncategorized bucket is last.
 * With no categories, all services share one flat bucket.
 */
export function sortServicesForDisplay(
  services: ServiceRow[],
  categories: ServiceCategoryRow[] = []
): ServiceRow[] {
  if (services.length === 0) return [];

  if (categories.length === 0) {
    return sortServicesWithinBucket(services);
  }

  const sortedCategories = [...categories].sort(compareCategories);
  const buckets = new Map<string | null, ServiceRow[]>();

  for (const category of sortedCategories) {
    buckets.set(category.id, []);
  }
  buckets.set(null, []);

  for (const service of services) {
    const categoryId = service.category_id ?? null;
    const bucketKey =
      categoryId != null && buckets.has(categoryId) ? categoryId : null;
    buckets.get(bucketKey)!.push(service);
  }

  const result: ServiceRow[] = [];
  for (const category of sortedCategories) {
    result.push(...sortServicesWithinBucket(buckets.get(category.id) ?? []));
  }
  result.push(...sortServicesWithinBucket(buckets.get(null) ?? []));

  return result;
}

/** Applies new bucket sort_order values after a reorder save. */
export function applyBucketSortOrder(
  services: ServiceRow[],
  orderedServiceIds: string[]
): ServiceRow[] {
  const sortOrderById = new Map(
    orderedServiceIds.map((id, index) => [id, sortOrderForBucketIndex(index)])
  );

  return services.map(service => {
    const nextOrder = sortOrderById.get(service.id);
    if (nextOrder === undefined) return service;
    return { ...service, sort_order: nextOrder };
  });
}
