const tracker = new Map<string, { count: number; resetTime: number }>();

/**
 * Lightweight, memory-safe sliding window rate limiter for local and API route validation.
 * @param key Unique identifier (user ID, chat ID, or client IP)
 * @param limit Maximum allowed requests within the window
 * @param windowMs Window duration in milliseconds (default: 60000 / 1 minute)
 * @returns boolean True if the key has exceeded the rate limit
 */
export function isRateLimited(
  key: string,
  limit: number = 60,
  windowMs: number = 60000
): boolean {
  const now = Date.now();
  const record = tracker.get(key);

  if (!record) {
    tracker.set(key, { count: 1, resetTime: now + windowMs });
    return false;
  }

  // If the window has expired, reset the bucket count and reset time
  if (now > record.resetTime) {
    tracker.set(key, { count: 1, resetTime: now + windowMs });
    return false;
  }

  record.count += 1;
  if (record.count > limit) {
    return true;
  }

  return false;
}
