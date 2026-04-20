/**
 * In-process sliding-window limiter (best-effort on a single Node isolate).
 * For distributed / serverless production traffic, set UPSTASH_REDIS_* env vars
 * so {@link publicApiRateLimit} uses Upstash instead.
 */
export class SlidingMemoryLimiter {
  private readonly hits = new Map<string, number[]>();
  private readonly maxKeys: number;

  constructor(maxKeys = 40_000) {
    this.maxKeys = maxKeys;
  }

  /**
   * @returns success and reset time (ms) when window refills or next allowed attempt.
   */
  allow(
    key: string,
    max: number,
    windowMs: number
  ): { success: boolean; reset: number } {
    const now = Date.now();
    const prev = this.hits.get(key) ?? [];
    const pruned = prev.filter(t => now - t < windowMs);

    if (pruned.length >= max) {
      const oldest = Math.min(...pruned);
      const reset = oldest + windowMs;
      this.hits.set(key, pruned);
      return { success: false, reset };
    }

    pruned.push(now);
    this.hits.set(key, pruned);
    if (this.hits.size > this.maxKeys) {
      this.evictOldestKeys(Math.floor(this.maxKeys * 0.1));
    }
    return { success: true, reset: now + windowMs };
  }

  private evictOldestKeys(count: number): void {
    let i = 0;
    for (const k of this.hits.keys()) {
      this.hits.delete(k);
      i++;
      if (i >= count) break;
    }
  }
}
