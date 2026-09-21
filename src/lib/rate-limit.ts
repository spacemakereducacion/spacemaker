type Bucket = { count: number; resetAt: number };

const buckets = new Map<string, Bucket>();

export function rateLimit(key: string, max: number, windowMs: number) {
  const now = Date.now();
  const current = buckets.get(key);
  if (!current || current.resetAt < now) {
    buckets.set(key, { count: 1, resetAt: now + windowMs });
    return { ok: true, remaining: max - 1 };
  }
  if (current.count >= max) {
    return { ok: false, remaining: 0, retryAt: current.resetAt };
  }
  current.count += 1;
  return { ok: true, remaining: max - current.count };
}

export function loginRateLimitKey(ip: string, email: string) {
  return `login:${ip}:${email.toLowerCase()}`;
}

/**
 * In-memory limiter for a single Node process.
 * Production multi-instance deployments should replace this with Redis.
 */
export function loginLimit(ip: string, email: string) {
  if (process.env.DEMO_LOGIN === "true") {
    return { ok: true, remaining: 999 };
  }
  const max = Number(process.env.RATE_LIMIT_LOGIN_MAX ?? 8);
  const windowMs = Number(process.env.RATE_LIMIT_LOGIN_WINDOW_SECONDS ?? 300) * 1000;
  return rateLimit(loginRateLimitKey(ip, email), max, windowMs);
}
