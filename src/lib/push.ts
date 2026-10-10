import api from './api';

export const VAPID_PUBLIC_KEY = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY || "BNy42jx6OcEDtrpZoqROk2gK_x65mfluhDAh4un53Oty_BOw1hliyJ89BkROxmwmXIEJUtubj1Qa7UAjisIVdQM";

export function urlBase64ToUint8Array(base64String: string) {
    const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
    const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");

    const rawData = window.atob(base64);
    const outputArray = new Uint8Array(rawData.length);

    for (let i = 0; i < rawData.length; ++i) {
        outputArray[i] = rawData.charCodeAt(i);
    }
    return outputArray;
}

export async function subscribeToPushNotifications(): Promise<{ success: boolean; error?: string }> {
    if (typeof window === 'undefined') return { success: false, error: 'Window not available' };
    if (!('serviceWorker' in navigator) || !('PushManager' in window) || !('Notification' in window)) {
        return { success: false, error: 'Push notifications are not supported on this browser/device.' };
    }

    try {
        const permission = await Notification.requestPermission();
        if (permission !== 'granted') {
            return { success: false, error: 'Notification permission was denied or dismissed.' };
        }

        // Register service worker if not already ready
        await navigator.serviceWorker.register('/sw.js').catch(() => {});
        const registration = await navigator.serviceWorker.ready;

        // Check if an existing subscription exists
        let subscription = await registration.pushManager.getSubscription();
        if (!subscription) {
            subscription = await registration.pushManager.subscribe({
                userVisibleOnly: true,
                applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY)
            });
        }

        // Save subscription to backend
        await api.post('/participants/push-subscribe', subscription);
        return { success: true };
    } catch (err: any) {
        console.error('Push notification subscription error:', err);
        return { success: false, error: err?.message || 'Failed to subscribe to push notifications.' };
    }
}
