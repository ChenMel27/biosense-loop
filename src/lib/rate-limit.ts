interface Bucket {
  count: number;
  resetAt: number;
}

declare global {
  var __exitloopRateLimits: Map<string, Bucket> | undefined;
}

const buckets = globalThis.__exitloopRateLimits ?? new Map<string, Bucket>();
globalThis.__exitloopRateLimits = buckets;

export function withinRateLimit(key: string, limit: number, windowMs: number) {
  const current = Date.now();
  const bucket = buckets.get(key);
  if (!bucket || bucket.resetAt <= current) {
    buckets.set(key, { count: 1, resetAt: current + windowMs });
    return true;
  }
  bucket.count += 1;
  return bucket.count <= limit;
}

export function requestFingerprint(request: Request) {
  return (
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    request.headers.get("x-real-ip") ||
    "local"
  );
}
