// Best-effort, per-instance rate limiting for the public audit endpoint.
//
// Each audit is an expensive Claude call (up to ~60s), so we cap how often a
// single client can trigger one. This keeps one abuser from burning the
// server's API budget and keeps the endpoint responsive. It is intentionally
// simple: an in-memory sliding window keyed by client IP. On serverless each
// instance keeps its own counters, so this is a first line of defense, not a
// global guarantee — the hard ceiling is the Anthropic workspace's spend cap.

const WINDOW_MS = Number(process.env.RATE_LIMIT_WINDOW_MS) || 60_000;
const MAX_REQUESTS = Number(process.env.RATE_LIMIT_MAX) || 8;

// Once we're tracking this many distinct clients, sweep out the ones whose
// windows have fully expired so the map can't grow without bound.
const SWEEP_THRESHOLD = 5_000;

const hits = new Map<string, number[]>();

export interface RateLimitResult {
  ok: boolean;
  /** Seconds to wait before retrying. Only meaningful when `ok` is false. */
  retryAfterSeconds: number;
  /** Requests still allowed in the current window. */
  remaining: number;
}

export function checkRateLimit(key: string, now: number = Date.now()): RateLimitResult {
  const windowStart = now - WINDOW_MS;
  const recent = (hits.get(key) ?? []).filter((t) => t > windowStart);

  if (recent.length >= MAX_REQUESTS) {
    hits.set(key, recent);
    const oldest = recent[0] ?? now;
    const retryAfterSeconds = Math.max(1, Math.ceil((oldest + WINDOW_MS - now) / 1000));
    return { ok: false, retryAfterSeconds, remaining: 0 };
  }

  recent.push(now);
  hits.set(key, recent);
  if (hits.size > SWEEP_THRESHOLD) sweep(windowStart);
  return { ok: true, retryAfterSeconds: 0, remaining: MAX_REQUESTS - recent.length };
}

function sweep(windowStart: number): void {
  for (const [key, times] of hits) {
    const live = times.filter((t) => t > windowStart);
    if (live.length === 0) hits.delete(key);
    else hits.set(key, live);
  }
}

/** Best guess at the client's IP from proxy headers (Vercel sets these). */
export function clientKey(req: Request): string {
  const forwarded = req.headers.get('x-forwarded-for');
  if (forwarded) {
    const first = forwarded.split(',')[0]?.trim();
    if (first) return first;
  }
  return req.headers.get('x-real-ip')?.trim() || 'unknown';
}
