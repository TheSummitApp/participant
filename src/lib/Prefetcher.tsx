/**
 * Prefetcher – after the authenticated user's main dashboard loads,
 * silently pre-fetch data for every other screen so that navigation
 * feels instant. Data is written directly into the localStorage cache
 * so that when the user navigates away, `useCache` finds it immediately.
 *
 * This component renders nothing. Mount it once inside the layout.
 */

"use client";

import { useEffect, useRef } from 'react';
import { usePathname } from 'next/navigation';
import api from './api';
import { setCache, getCached, isCacheStale } from './cache';

export default function Prefetcher() {
    const pathname = usePathname();
    const hasPrefetched = useRef(false);

    useEffect(() => {
        // Only prefetch when inside the authenticated area
        const publicRoutes = ['/login', '/auto-login', '/v'];
        if (publicRoutes.some(r => pathname.startsWith(r))) return;

        // Don't double-prefetch during the same session
        if (hasPrefetched.current) return;
        hasPrefetched.current = true;

        const prefetchAll = async () => {
            try {
                // 1. Profile is the foundation – needed by other fetches
                let profile = getCached<{ id: string; summit_id?: string }>('profile');
                if (!profile || isCacheStale(profile)) {
                    const profileRes = await api.get('/participants/profile');
                    setCache('profile', profileRes.data);
                    profile = { data: profileRes.data, timestamp: Date.now() };
                }

                const summitId = profile.data.summit_id;
                const participantId = profile.data.id;

                // 2. Prefetch everything else in parallel
                const promises: Promise<void>[] = [];

                // Itinerary
                if (summitId && isCacheStale(getCached('itinerary'))) {
                    promises.push(
                        api.get(`/itinerary/${summitId}`)
                            .then(r => setCache('itinerary', r.data))
                            .catch(() => { /* silent */ })
                    );
                }

                // Announcements / Notifications
                if (summitId && isCacheStale(getCached('announcements'))) {
                    promises.push(
                        api.get(`/announcements/${summitId}`)
                            .then(r => setCache('announcements', r.data))
                            .catch(() => { /* silent */ })
                    );
                }

                // Notes
                if (participantId && isCacheStale(getCached('notes'))) {
                    promises.push(
                        api.get(`/notes?participant_id=${participantId}`)
                            .then(r => setCache('notes', r.data))
                            .catch(() => { /* silent */ })
                    );
                }

                await Promise.allSettled(promises);
            } catch {
                // Prefetch is best-effort — never block the app
            }
        };

        // Give the main screen a 500ms head-start then prefetch the rest
        const timer = setTimeout(prefetchAll, 500);
        return () => clearTimeout(timer);
    }, [pathname]);

    return null; // renders nothing
}
