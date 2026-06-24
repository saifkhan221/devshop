/**
 * Request Throttler — app-level DDoS defence
 *
 * Prevents any single user session from flooding Firebase/backend
 * with too many requests in a short time window.
 *
 * Works as a token-bucket: you get N tokens per window.
 * Each request costs 1 token. When tokens run out, requests are
 * queued (with a max queue depth) and processed as tokens refill.
 */

const BUCKETS = new Map() // one bucket per "action key"

const DEFAULTS = {
  maxTokens: 20,        // max burst
  refillRate: 10,       // tokens added per window
  windowMs: 1000,       // refill every 1 second
  maxQueue: 5,          // max queued requests before dropping
}

function getBucket(key, opts = {}) {
  if (!BUCKETS.has(key)) {
    const cfg = { ...DEFAULTS, ...opts }
    BUCKETS.set(key, {
      tokens: cfg.maxTokens,
      lastRefill: Date.now(),
      queue: [],
      cfg,
    })
  }
  return BUCKETS.get(key)
}

function refill(bucket) {
  const now = Date.now()
  const elapsed = now - bucket.lastRefill
  const tokensToAdd = Math.floor(elapsed / bucket.cfg.windowMs) * bucket.cfg.refillRate
  if (tokensToAdd > 0) {
    bucket.tokens = Math.min(bucket.cfg.maxTokens, bucket.tokens + tokensToAdd)
    bucket.lastRefill = now
  }
}

/**
 * throttle(key, fn, opts?)
 *
 * Wraps any async function with throttling.
 * Returns the result of fn, or throws if the queue is full (flood detected).
 *
 * Usage:
 *   await throttle('firestore:getProjects', () => dbService.getProjects(uid))
 */
export function throttle(key, fn, opts = {}) {
  return new Promise((resolve, reject) => {
    const bucket = getBucket(key, opts)
    refill(bucket)

    if (bucket.tokens >= 1) {
      bucket.tokens--
      resolve(fn())
      return
    }

    // Queue the request
    if (bucket.queue.length >= bucket.cfg.maxQueue) {
      reject(new Error('Too many requests. Please slow down.'))
      return
    }

    bucket.queue.push({ fn, resolve, reject })

    // Process queue as tokens refill
    const interval = setInterval(() => {
      refill(bucket)
      while (bucket.queue.length > 0 && bucket.tokens >= 1) {
        bucket.tokens--
        const next = bucket.queue.shift()
        next.resolve(next.fn())
      }
      if (bucket.queue.length === 0) clearInterval(interval)
    }, bucket.cfg.windowMs)
  })
}

/**
 * debounce(fn, delayMs)
 *
 * Standard debounce — collapses rapid calls into one.
 * Use for search inputs, live-preview saves, etc.
 */
export function debounce(fn, delayMs = 300) {
  let timer = null
  return (...args) => {
    clearTimeout(timer)
    timer = setTimeout(() => fn(...args), delayMs)
  }
}
