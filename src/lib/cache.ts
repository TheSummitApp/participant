/**
 * Summit Participant – localStorage Cache Layer
 *
 * Strategy: stale-while-revalidate
 *   1. On mount, return cached data instantly (no spinner).
 *   2. Kick off a background fetch.
 *   3. When the fresh response arrives, update state + cache.
 *   4. On explicit refresh (pull-to-refresh, page reload) the cache is
 *      updated *after* the fresh data comes back so the user never sees
 *      a blank screen.
 */

const CACHE_PREFIX = 'summit_cache_';

export interface CacheEntry<T = unknown> {
    data: T;
    timestamp: number;       // epoch ms
}

// ----- low-level helpers -----

export function getCached<T = unknown>(key: string): CacheEntry<T> | null {
    try {
        const raw = localStorage.getItem(CACHE_PREFIX + key);
        if (!raw) return null;
        return JSON.parse(raw) as CacheEntry<T>;
    } catch {
        return null;
    }
}

export function setCache<T = unknown>(key: string, data: T): void {
    try {
        const entry: CacheEntry<T> = { data, timestamp: Date.now() };
        localStorage.setItem(CACHE_PREFIX + key, JSON.stringify(entry));
    } catch {
        // localStorage full – silently skip
    }
}

export function clearCache(key?: string): void {
    if (key) {
        localStorage.removeItem(CACHE_PREFIX + key);
    } else {
        // Clear all summit cache entries
        const keysToRemove: string[] = [];
        for (let i = 0; i < localStorage.length; i++) {
            const k = localStorage.key(i);
            if (k?.startsWith(CACHE_PREFIX)) keysToRemove.push(k);
        }
        keysToRemove.forEach((k) => localStorage.removeItem(k));
    }
}

/** Check if cache is older than `maxAgeMs` (default 5 minutes). */
export function isCacheStale(entry: CacheEntry | null, maxAgeMs = 5 * 60 * 1000): boolean {
    if (!entry) return true;
    return Date.now() - entry.timestamp > maxAgeMs;
}
