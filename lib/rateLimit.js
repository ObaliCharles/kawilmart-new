// Lightweight in-memory sliding-window rate limiter. Per server instance —
// enough to stop accidental double-fire and casual abuse without new infra.
// For multi-instance deployments swap the store for Redis behind the same API.
const buckets = new Map();
const MAX_BUCKETS = 10000;

const prune = (now) => {
    if (buckets.size < MAX_BUCKETS) return;
    for (const [key, bucket] of buckets) {
        if (bucket.resetAt <= now) buckets.delete(key);
        if (buckets.size < MAX_BUCKETS / 2) break;
    }
};

/**
 * checkRateLimit("order:user_123", { limit: 5, windowMs: 60000 })
 * → { allowed: boolean, retryAfterSeconds: number }
 */
export const checkRateLimit = (key, { limit = 10, windowMs = 60000 } = {}) => {
    const now = Date.now();
    prune(now);

    const bucket = buckets.get(key);
    if (!bucket || bucket.resetAt <= now) {
        buckets.set(key, { count: 1, resetAt: now + windowMs });
        return { allowed: true, retryAfterSeconds: 0 };
    }

    if (bucket.count >= limit) {
        return { allowed: false, retryAfterSeconds: Math.ceil((bucket.resetAt - now) / 1000) };
    }

    bucket.count += 1;
    return { allowed: true, retryAfterSeconds: 0 };
};

export const rateLimitResponse = (retryAfterSeconds) => ({
    success: false,
    message: `Too many requests. Please try again in ${retryAfterSeconds}s.`,
});
