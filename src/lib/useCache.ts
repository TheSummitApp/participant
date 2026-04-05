/**
 * useCache – React hook for stale-while-revalidate caching.
 *
 * Usage:
 *   const { data, loading, refreshing } = useCache('profile', () => api.get('/participants/profile').then(r => r.data));
 *
 *   - `loading`    → true only when there is NO cached data and we're fetching
 *   - `refreshing` → true when we're revalidating in the background (cached data is already shown)
 *   - `data`       → cached or fresh data
 *   - `error`      → last fetch error (cached data is still shown)
 *   - `refresh()`  → force a background revalidation
 */

import { useEffect, useState, useCallback, useRef } from 'react';
import { getCached, setCache } from './cache';

export interface UseCacheResult<T> {
    data: T | null;
    loading: boolean;       // true when no cached data and fetching
    refreshing: boolean;    // true when revalidating with existing data
    error: unknown | null;
    refresh: () => void;
}

export function useCache<T>(
    key: string,
    fetcher: () => Promise<T>,
    options?: { enabled?: boolean }
): UseCacheResult<T> {
    const enabled = options?.enabled ?? true;

    // Initialize from cache synchronously
    const cached = enabled ? getCached<T>(key) : null;
    const [data, setData] = useState<T | null>(cached?.data ?? null);
    const [loading, setLoading] = useState(!cached?.data && enabled);
    const [refreshing, setRefreshing] = useState(false);
    const [error, setError] = useState<unknown | null>(null);
    const mountedRef = useRef(true);

    const doFetch = useCallback(async () => {
        if (!enabled) return;

        const hasCachedData = data !== null;
        if (hasCachedData) {
            setRefreshing(true);
        } else {
            setLoading(true);
        }

        try {
            const freshData = await fetcher();
            if (!mountedRef.current) return;
            setData(freshData);
            setCache(key, freshData);
            setError(null);
        } catch (err) {
            if (!mountedRef.current) return;
            setError(err);
            // Don't clear cached data on error — keep showing stale
        } finally {
            if (mountedRef.current) {
                setLoading(false);
                setRefreshing(false);
            }
        }
    }, [key, fetcher, enabled, data]);

    // Fetch on mount (revalidate in background even if we have cache)
    useEffect(() => {
        mountedRef.current = true;
        doFetch();
        return () => { mountedRef.current = false; };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [key, enabled]);

    return { data, loading, refreshing, error, refresh: doFetch };
}
