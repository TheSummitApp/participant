"use client";
import { useState, useEffect } from 'react';
import { usePathname } from 'next/navigation';
import { Download, Bell, X } from 'lucide-react';

import api from '@/lib/api';

const VAPID_PUBLIC_KEY = "BNy42jx6OcEDtrpZoqROk2gK_x65mfluhDAh4un53Oty_BOw1hliyJ89BkROxmwmXIEJUtubj1Qa7UAjisIVdQM";

function urlBase64ToUint8Array(base64String: string) {
    const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
    const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");

    const rawData = window.atob(base64);
    const outputArray = new Uint8Array(rawData.length);

    for (let i = 0; i < rawData.length; ++i) {
        outputArray[i] = rawData.charCodeAt(i);
    }
    return outputArray;
}

export default function PwaPrompt() {
    const pathname = usePathname();
    const [isStandalone, setIsStandalone] = useState(true);
    const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
    const [showInstallPrompt, setShowInstallPrompt] = useState(false);
    const [showNotificationPrompt, setShowNotificationPrompt] = useState(false);
    const [isIOS, setIsIOS] = useState(false);

    useEffect(() => {
        // Register Service Worker
        if ('serviceWorker' in navigator) {
            navigator.serviceWorker.register('/sw.js').catch((err) => {
                console.error('Service Worker registration failed:', err);
            });
        }

        const isAppleOS = /iPad|iPhone|iPod/.test(navigator.userAgent) && !(window as any).MSStream;
        setIsIOS(isAppleOS);

        const checkStandalone = window.matchMedia('(display-mode: standalone)').matches || (window.navigator as any).standalone === true;
        setIsStandalone(checkStandalone);

        // Only show prompts if user is theoretically logged in (not on login page)
        if (!pathname.startsWith('/login') && !pathname.startsWith('/auto-login')) {
            if (!checkStandalone) {
                // Not installed
                const dismissed = sessionStorage.getItem("pwa_install_dismissed");
                if (!dismissed) {
                    setShowInstallPrompt(true);
                }
            } else {
                // Is installed, check notifications
                if ('Notification' in window && Notification.permission === 'default') {
                    const dismissed = sessionStorage.getItem("pwa_notif_dismissed");
                    if (!dismissed) {
                        setShowNotificationPrompt(true);
                    }
                }
            }
        } else {
            setShowInstallPrompt(false);
            setShowNotificationPrompt(false);
        }

        const handleBeforeInstallPrompt = (e: any) => {
            e.preventDefault();
            setDeferredPrompt(e);
        };

        window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
        return () => window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    }, [pathname]);

    const handleInstall = async () => {
        if (deferredPrompt) {
            deferredPrompt.prompt();
            const { outcome } = await deferredPrompt.userChoice;
            if (outcome === 'accepted') {
                setDeferredPrompt(null);
                setShowInstallPrompt(false);
            }
        } else if (isIOS) {
            alert("To install on iOS: Tap the 'Share' icon at the bottom of Safari, then select 'Add to Home Screen'.");
        } else {
            alert("To install, look for the 'Add to Home screen' or 'Install' option in your browser menu.");
        }
    };

    const handleAllowNotifications = async () => {
        try {
            const permission = await Notification.requestPermission();
            if (permission === 'granted') {
                const registration = await navigator.serviceWorker.ready;

                // Subscribe the user
                const subscription = await registration.pushManager.subscribe({
                    userVisibleOnly: true,
                    applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY)
                });

                // Send subscription to backend
                await api.post('/participants/push-subscribe', subscription);

                setShowNotificationPrompt(false);
            } else {
                setShowNotificationPrompt(false);
            }
        } catch (err) {
            console.error("Failed to subscribe to push notifications:", err);
            setShowNotificationPrompt(false);
        }
    };

    const dismissInstall = () => {
        sessionStorage.setItem("pwa_install_dismissed", "true");
        setShowInstallPrompt(false);
    };

    const dismissNotification = () => {
        sessionStorage.setItem("pwa_notif_dismissed", "true");
        setShowNotificationPrompt(false);
    };

    if (showInstallPrompt) {
        return (
            <div className="fixed bottom-[85px] left-4 right-4 bg-[#002855] text-white p-5 rounded-[1.5rem] shadow-xl z-50 flex flex-col gap-4 animate-in slide-in-from-bottom duration-300 border border-blue-900 overflow-hidden">
                <button onClick={dismissInstall} className="absolute top-3 right-3 text-white/50 hover:text-white p-1">
                    <X size={18} />
                </button>
                <div className="flex items-start gap-4 pr-6">
                    <div className="w-12 h-12 bg-white/10 rounded-xl flex items-center justify-center shrink-0">
                        <Download size={24} className="text-white" />
                    </div>
                    <div>
                        <h3 className="font-black text-lg leading-tight">Install Summit App</h3>
                        <p className="text-sm font-medium text-blue-100 mt-1">Get home screen access and enable push notifications!</p>
                    </div>
                </div>
                <div className="flex items-center gap-2 mt-2">
                    <button onClick={handleInstall} className="flex-1 bg-white text-[#002855] font-black py-3 rounded-xl hover:bg-slate-100 active:scale-95 transition-transform text-sm">
                        Install Now
                    </button>
                </div>
            </div>
        );
    }

    if (showNotificationPrompt) {
        return (
            <div className="fixed bottom-[85px] left-4 right-4 bg-emerald-600 text-white p-5 rounded-[1.5rem] shadow-xl z-50 flex flex-col gap-4 animate-in slide-in-from-bottom duration-300 border border-emerald-700">
                <button onClick={dismissNotification} className="absolute top-3 right-3 text-white/50 hover:text-white p-1">
                    <X size={18} />
                </button>
                <div className="flex items-start gap-4 pr-6">
                    <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center shrink-0 shadow-inner">
                        <Bell size={24} className="text-white fill-white/20" />
                    </div>
                    <div>
                        <h3 className="font-black text-lg leading-tight">Enable Notifications</h3>
                        <p className="text-sm font-medium text-emerald-100 mt-1">Stay updated with real-time schedule changes and food alerts.</p>
                    </div>
                </div>
                <div className="flex items-center gap-2 mt-2">
                    <button onClick={handleAllowNotifications} className="flex-1 bg-white text-emerald-700 font-black py-3 rounded-xl hover:bg-slate-100 active:scale-95 transition-transform text-sm">
                        Allow Alerts
                    </button>
                </div>
            </div>
        );
    }

    return null;
}
