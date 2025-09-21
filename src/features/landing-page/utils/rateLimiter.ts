// Simple in-memory rate limiter for client-side protection
// For production, consider using Redis or database-based rate limiting

interface RateLimitEntry {
  count: number;
  resetTime: number;
}

class RateLimiter {
  private requests: Map<string, RateLimitEntry> = new Map();
  private readonly windowMs: number;
  private readonly maxRequests: number;

  constructor(windowMs: number = 60000, maxRequests: number = 5) {
    this.windowMs = windowMs; // 1 minute default
    this.maxRequests = maxRequests; // 5 requests per minute default
  }

  /**
   * Check if a request is allowed
   */
  isAllowed(key: string): boolean {
    const now = Date.now();
    const entry = this.requests.get(key);

    if (!entry) {
      // First request
      this.requests.set(key, {
        count: 1,
        resetTime: now + this.windowMs,
      });
      return true;
    }

    if (now > entry.resetTime) {
      // Window has expired, reset
      this.requests.set(key, {
        count: 1,
        resetTime: now + this.windowMs,
      });
      return true;
    }

    if (entry.count >= this.maxRequests) {
      // Rate limit exceeded
      return false;
    }

    // Increment count
    entry.count++;
    this.requests.set(key, entry);
    return true;
  }

  /**
   * Get remaining requests for a key
   */
  getRemainingRequests(key: string): number {
    const entry = this.requests.get(key);
    if (!entry || Date.now() > entry.resetTime) {
      return this.maxRequests;
    }
    return Math.max(0, this.maxRequests - entry.count);
  }

  /**
   * Get time until reset for a key
   */
  getTimeUntilReset(key: string): number {
    const entry = this.requests.get(key);
    if (!entry || Date.now() > entry.resetTime) {
      return 0;
    }
    return entry.resetTime - Date.now();
  }

  /**
   * Clear expired entries
   */
  cleanup(): void {
    const now = Date.now();
    for (const [key, entry] of this.requests.entries()) {
      if (now > entry.resetTime) {
        this.requests.delete(key);
      }
    }
  }
}

// Create rate limiter instances
export const waitlistRateLimiter = new RateLimiter(60000, 3); // 3 requests per minute for waitlist
export const generalRateLimiter = new RateLimiter(60000, 10); // 10 requests per minute for general use

// Cleanup expired entries every 5 minutes
setInterval(
  () => {
    waitlistRateLimiter.cleanup();
    generalRateLimiter.cleanup();
  },
  5 * 60 * 1000
);

/**
 * Get a rate limit key based on user's IP and user agent
 * In a real app, you'd get the IP from the request
 */
export function getRateLimitKey(): string {
  // For client-side, we'll use a combination of factors
  // In production, this should be handled server-side with actual IP
  const userAgent =
    typeof window !== 'undefined' ? window.navigator.userAgent : '';
  const timestamp = Math.floor(Date.now() / (1000 * 60)); // Round to nearest minute
  return `waitlist_${userAgent.slice(0, 20)}_${timestamp}`;
}

/**
 * Rate limiting hook for React components
 */
export function useRateLimit(rateLimiter: RateLimiter = waitlistRateLimiter) {
  const checkRateLimit = (): {
    allowed: boolean;
    remaining: number;
    timeUntilReset: number;
  } => {
    const key = getRateLimitKey();
    const allowed = rateLimiter.isAllowed(key);
    const remaining = rateLimiter.getRemainingRequests(key);
    const timeUntilReset = rateLimiter.getTimeUntilReset(key);

    return { allowed, remaining, timeUntilReset };
  };

  return { checkRateLimit };
}
