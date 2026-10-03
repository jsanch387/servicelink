export function listPageCount(total: number, pageSize: number): number {
  if (total <= 0 || pageSize <= 0) return 1;
  return Math.ceil(total / pageSize);
}

export function listPageItems<T>(
  items: readonly T[],
  page: number,
  pageSize: number
): T[] {
  const count = listPageCount(items.length, pageSize);
  const safePage = Math.min(Math.max(0, page), count - 1);
  const start = safePage * pageSize;
  return items.slice(start, start + pageSize);
}
