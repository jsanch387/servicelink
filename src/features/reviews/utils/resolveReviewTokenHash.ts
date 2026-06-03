import { resolveQuoteTokenHash } from '@/features/quotes/shared/utils/resolveQuoteTokenHash';

/** SHA-256 hex of raw `/review/{token}` path segment (same as quote links). */
export function resolveReviewTokenHash(tokenOrHash: string): string {
  return resolveQuoteTokenHash(tokenOrHash);
}
