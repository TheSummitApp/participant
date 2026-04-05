/**
 * OfflineIndicator – detects network status and shows a subtle overlay
 * when the user is offline. High-impact since summits are often in 
 * crowded areas with spotty WiFi.
 */

"use client";

import { useState, useEffect } from 'react';
import { WifiOff } from 'lucide-react';

export default function OfflineIndicator() {
    const [isOffline, setIsOffline] = useState(false);

    useEffect(() => {
        setIsOffline(!navigator.onLine);

        const handleOnline = () => setIsOffline(false);
        const handleOffline = () => setIsOffline(true);

        window.addEventListener('online', handleOnline);
        window.addEventListener('offline', handleOffline);

        return () => {
            window.removeEventListener('online', handleOnline);
            window.removeEventListener('offline', handleOffline);
        };
    }, []);

    if (!isOffline) return null;

    return (
        <div className="fixed top-0 left-0 right-0 z-[100] animate-in slide-in-from-top duration-300">
            <div className="bg-rose-500 text-white text-[10px] font-black uppercase tracking-[0.2em] py-2 flex items-center justify-center gap-2 shadow-lg">
                <WifiOff size={12} strokeWidth={3} />
                Offline Mode – Using Cached Data
            </div>
        </div>
    );
}
