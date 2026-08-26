/**
 * Run `mapper` over `items` with at most `concurrency` in flight.
 * Result order matches input order.
 */
export async function mapWithConcurrency<T, R>(
  items: readonly T[],
  concurrency: number,
  mapper: (item: T, index: number) => Promise<R>
): Promise<R[]> {
  if (items.length === 0) return [];

  const limit = Math.max(1, Math.min(Math.floor(concurrency), items.length));
  const results = new Array<R>(items.length);
  let nextIndex = 0;

  async function worker() {
    while (nextIndex < items.length) {
      const index = nextIndex;
      nextIndex += 1;
      results[index] = await mapper(items[index] as T, index);
    }
  }

  await Promise.all(Array.from({ length: limit }, () => worker()));
  return results;
}
